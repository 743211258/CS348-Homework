import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('myDatabase.db');

// A data table for The Data Mine team
export const initDatabase = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS STAFF (
      staff_id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT
    )
  ` );

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS STUDENT (
      puid INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      year INTEGER
    )
  ` );

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS COMPANY (
      company_id INTEGER PRIMARY KEY NOT NULL,
      company_name TEXT NOT NULL,
      contact TEXT NOT NULL
    )
  ` );

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS CORPORATE_PARTNER (
      cp_id INTEGER PRIMARY KEY NOT NULL,
      description TEXT,
      year INTEGER NOT NULL
    )
  ` );

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS CORPORATE_PARTNER_PROGRAM (
      program_id INTEGER PRIMARY KEY NOT NULL,
      company_id INTEGER NOT NULL,
      cp_id INTEGER NOT NULL,
      description TEXT,
      maximum_students INTEGER,
      year INTEGER NOT NULL,
      FOREIGN KEY (company_id) REFERENCES COMPANY(company_id),
      FOREIGN KEY (cp_id) REFERENCES CORPORATE_PARTNER(cp_id)
    ) 
  ` );

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS TICKET (
      ticket_id INTEGER PRIMARY KEY NOT NULL,
      puid INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      conversation TEXT NOT NULL, 
      start_timestamp TEXT,
      end_timestamp TEXT,   
      FOREIGN KEY (puid) REFERENCES STUDENT(puid),
      FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id)
    )  
  `)

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS timestamp_range_index
    ON TICKET(start_timestamp);

    CREATE INDEX IF NOT EXISTS idx_ticket_puid
    ON TICKET(puid);

    CREATE INDEX IF NOT EXISTS idx_ticket_staff_id
    ON TICKET(staff_id);
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS TICKET_CC (
      ticket_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES TICKET(ticket_id),
      FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id)
    )  
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS APPLY (
      application_id INTEGER PRIMARY KEY NOT NULL,
      puid INTEGER NOT NULL,
      cp_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      student_response TEXT NOT NULL,  
      decision TEXT NOT NULL,
      FOREIGN KEY (puid) REFERENCES STUDENT(puid),
      FOREIGN KEY (cp_id) REFERENCES CORPORATE_PARTNER(cp_id),
      FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id),
      UNIQUE(puid, cp_id)
    )  
  `)

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS CHOOSE (
      select_id INTEGER PRIMARY KEY NOT NULL,
      puid INTEGER NOT NULL,
      program_id INTEGER NOT NULL,
      FOREIGN KEY (puid) REFERENCES STUDENT(puid),
      FOREIGN KEY (program_id) REFERENCES CORPORATE_PARTNER_PROGRAM(program_id),
      UNIQUE(puid, program_id)
    )  
  `)

  console.log("The database has been created successfully!");

  // Insert all staffs
  await db.runAsync(
    `INSERT OR IGNORE INTO STAFF (staff_id, name, email, role) VALUES (?, ?, ?, ?)`,
    [1, 'Alice', 'alice287@purdue.edu', 'TA']
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO STAFF (staff_id, name, email, role) VALUES (?, ?, ?, ?)`,
    [2, 'Bob', 'bob49483@purdue.edu', 'Researcher']
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO STAFF (staff_id, name, email, role) VALUES (?, ?, ?, ?)`,
    [3, 'Raymond', 'raymond1@purdue.edu', 'Mentor']
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO STAFF (staff_id, name, email, role) VALUES (?, ?, ?, ?)`,
    [4, 'Robert', 'robert34@purdue.edu', 'Head TA']
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO STAFF (staff_id, name, email, role) VALUES (?, ?, ?, ?)`,
    [5, 'William', 'william1@purdue.edu', 'Manager']
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO STAFF (staff_id, name, email, role) VALUES (?, ?, ?, ?)`,
    [6, 'Mark', 'mdw@purdue.edu', 'Director']
  );

  // Insert all students
  await db.runAsync(
    `INSERT OR IGNORE INTO STUDENT (puid, name, email, year) VALUES (?, ?, ?, ?)`,
    [1001, 'Bob', 'bob12453@purdue.edu', 2026]
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO STUDENT (puid, name, email, year) VALUES (?, ?, ?, ?)`,
    [1002, 'Michael', 'michael2@purdue.edu', 2025]
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO STUDENT (puid, name, email, year) VALUES (?, ?, ?, ?)`,
    [1003, 'Larry', 'larry373@purdue.edu', 2028]
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO STUDENT (puid, name, email, year) VALUES (?, ?, ?, ?)`,
    [1004, 'David', 'david384@purdue.edu', 2029]
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO STUDENT (puid, name, email, year) VALUES (?, ?, ?, ?)`,
    [1005, 'Spongebob', 'spongeb3@purdue.edu', 2026]
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO STUDENT (puid, name, email, year) VALUES (?, ?, ?, ?)`,
    [1006, 'Patrick', 'patrick3@purdue.edu', 2027]
  );
    
  await 
    console.log("Successfully initialized the database");
}