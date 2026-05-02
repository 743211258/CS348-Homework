import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('myDatabase.db');

// File/Insert an ticket
export const fileTicket = async (puid: number, staff_id: number, text: string, start_timestamp: string) => {
  try {
    const result = await db.runAsync (
      `INSERT INTO TICKET (puid, staff_id, conversation, start_timestamp) VALUES (?, ?, ?, ?)`,
      [puid, staff_id, text, start_timestamp]
    );
    console.log("Successfully filed a ticket!");
    return result.lastInsertRowId;
  } catch (error) {
    console.log("Failed to filed a ticket!");
    throw error;
  }
}

// Change/Update a ticket
export const changeTicket = async (puid: number, staff_id: number, text: string, ticket_id: number) => {
  try {
    const result = await db.runAsync (
      `UPDATE TICKET 
      SET puid = ?, staff_id = ?, conversation = ? 
      WHERE ticket_id = ?`,
      [puid, staff_id, text, ticket_id]
    );
    console.log("Successfully changed a ticket!");
  } catch (error) {
    console.log("Failed to change a ticket!");
    throw error;
  }
}

// Delete a ticket
export const deleteTicket = async (ticket_id: number) => {
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync (
        `DELETE FROM TICKET_CC WHERE ticket_id = ?`,
        [ticket_id]
      )

      await db.runAsync (
        `DELETE FROM TICKET WHERE ticket_id = ?`,
        [ticket_id]
      )
    });
    console.log("Successfully deleted a ticket!");
  } catch (error) {
    console.log("Failed to delete a ticket!");
    throw error;
  }
}

// Insert into ticket_cc table
export const insert_cc_ticket = async (ticket_id: number, staff_id_list: Array<number>) => {
  try {
    console.log("Starting to CC to other staffs!");
    await db.withTransactionAsync(async () => {
      for (const staff of staff_id_list) {
        await db.runAsync(
          `INSERT INTO TICKET_CC (ticket_id, staff_id) VALUES (?, ?)`,
          [ticket_id, staff]
        )
      }
    });
    console.log("Successfully inserted all staffs to the cc table");
  } catch (error) {
    console.log("Failed to insert all staff to the cc table");
    throw error;
  }
}

// Update ticket_cc table
export const update_cc_ticket = async (ticket_id: number, new_staff_id_list: Array<number>) => {
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `DELETE FROM TICKET_CC WHERE ticket_id = ?`,
        [ticket_id]
      );
      for (const staff of new_staff_id_list) {
        await db.runAsync(
          `INSERT INTO TICKET_CC (ticket_id, staff_id) VALUES (?, ?)`,
          [ticket_id, staff]
        );
      }
    });
  } catch (error) {
    throw error; 
  }
}

// Fetch all tickets
export const getAllTicket = async () => {
  try {
    const result = await db.getAllAsync('SELECT * FROM TICKET');
    console.log("Tickets are now available to see!");
    return result;
  } catch (error) {
    console.log("Unable to fetch tickets");
    throw error;
  }
}

// Fetch all cc
export const getAllCC = async (ticket_id: number) => {
  try {
    const result = await db.getAllAsync<{ staff_id: number }>(
      'SELECT staff_id FROM TICKET_CC WHERE ticket_id = ?',
      [ticket_id]
    );    console.log("CC are now available to see!");
    return result.map(item => item.staff_id);
  } catch (error) {
    console.log("Unable to fetch CC");
    throw error;
  }
}

// Fetch all students
export const getAllStudent = async () => {
  try {
    const result = await db.getAllAsync('SELECT * FROM STUDENT');
    console.log("Successfully fetched students for the dropdown!");
    return result;
  } catch (error) {
    console.log("Unable to fetch students");
    throw error;
  }
}

// Fetch all staffs
export const getAllStaff = async () => {
  try {
    const result = await db.getAllAsync('SELECT * FROM STAFF');
    console.log("Successfully fetched staffs for the dropdown!");
    return result;
  } catch (error) {
    console.log("Unable to fetch staffs");
    throw error;
  }
}

// Generate ticket report (Number of tickets, Average length of all tickets, and the total number of cc's / total number of tickets)
export const getTicketReport = async (puid: Array<number>, staff_id: Array<number>, startDate: string, endDate: string) => {
  try {
    if (puid.length == 0 || staff_id.length == 0) {
      return [];    
    }
    
    const puidPlaceholders = puid.map(() => '?').join(',');
    const staffPlaceholders = staff_id.map(() => '?').join(',');
    const parameters = [
      startDate,
      endDate,
      ...puid,
      ...staff_id
    ]

    const statistics = await db.getAllAsync(
      `SELECT 
       COUNT(*) as total_tickets,
       AVG(LENGTH(conversation)) as average_message_length,
       AVG(
         CASE WHEN EXISTS (SELECT 1 
                           FROM TICKET_CC
                           WHERE TICKET_CC.ticket_id = TICKET.ticket_id
                          ) THEN 1.0 ELSE 0.0 END
       ) * 100 as ticket_cc_percentage
       FROM TICKET
       WHERE (start_timestamp BETWEEN ? AND ?)
              AND puid IN (${puidPlaceholders})
              AND staff_id IN (${staffPlaceholders})`,
      parameters
    );

    const ticketList = await db.getAllAsync<any>(
      `SELECT T.ticket_id, T.puid, T.staff_id, T.conversation, T.start_timestamp,
        EXISTS (SELECT 1 FROM TICKET_CC WHERE ticket_id = T.ticket_id) as has_cc
      FROM TICKET T
      WHERE (start_timestamp BETWEEN ? AND ?)
        AND puid IN (${puidPlaceholders})
        AND staff_id IN (${staffPlaceholders})
      ORDER BY T.start_timestamp DESC`,
      parameters
    );

    const stats = statistics[0] as { 
      total_tickets: number; 
      average_message_length: number; 
      ticket_cc_percentage: number; 
    };

    return [
      {
        totalTickets: stats.total_tickets,
        avgMessageLength: stats.average_message_length,
        ccPercentage: stats.ticket_cc_percentage
      },
      ticketList
    ];
  } catch (error) {
    console.log("Unable to generate ticket report!");
    throw error;
  }
}