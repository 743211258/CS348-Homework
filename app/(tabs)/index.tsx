import { initDatabase } from '@/src/database/database';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  changeTicket,
  deleteTicket,
  fileTicket,
  getAllCC,
  getAllStaff,
  getAllStudent,
  getAllTicket,
  insert_cc_ticket,
  update_cc_ticket
} from '../../src/database/db_operation';

import { Picker } from '@react-native-picker/picker';

function TicketForm({ onSuccess, editItem, onCancelEdit }: any) {
  // User input
  const [puid, setPuid] = useState<number | ''>('');
  const [staffId, setStaffId] = useState<number | ''>('');
  const [text, setText] = useState('');
  const [selectedCC, setSelectedCC] = useState<number[]>([]);
  
  // Fetch all staffs and students as reference to the input.
  const [students, setStudents] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);

  const toggleCC = (id: number) => {
    if (selectedCC.includes(id)) {
      setSelectedCC(selectedCC.filter(item => item !== id));
    } else {
      setSelectedCC([...selectedCC, id]);
    }
  };

  // We load all students and staffs the first time that this page is rendered
  useEffect(() => {
    const fetchData = async () => {
      try {
        await initDatabase();
        const s = await getAllStudent();
        const st = await getAllStaff();
        setStudents(s || []);
        setStaffs(st || []);

        if (editItem) {
          setPuid(editItem.puid);
          setStaffId(editItem.staff_id);
          setText(editItem.conversation || "");
          
          const currentCCIds = await getAllCC(editItem.ticket_id);
          setSelectedCC(currentCCIds);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [editItem]);

  // The function to handle ticket submissions
  const handleSubmit = async () => {
    // First check if any parameter is missing
    if (!puid) {
      Alert.alert("Missing students' PUID!");
      return;
    }
    if (!staffId) {
      Alert.alert("Missing staffs' ID!");
      return;
    }
    if (!text) {
      Alert.alert("Tickets cannot be empty!");
      return;
    }
    try {
      // Check if it is in edit mode
      if (editItem) {
        // Change the messages.
        await changeTicket(puid, staffId, text, editItem.ticket_id);
        await update_cc_ticket(editItem.ticket_id, selectedCC);
        Alert.alert("Your ticket is updated.");
      } else {
        // Or in the append mode.
        const now = new Date().toISOString().split('T')[0];
        const newId = await fileTicket(puid, staffId, text, now);
        
        // CC to other people if the user specifies.
        if (selectedCC.length > 0) {
          await insert_cc_ticket(newId, selectedCC);
        }
        Alert.alert("Successfully cc to other staffs");
      }
      // Reset the UI
      resetForm();
      onSuccess();
    } catch (error) {
      Alert.alert("Inserting or changing a ticket Failed!");
    }
  };

  // Reset the form after submission
  const resetForm = () => {
    setPuid('');
    setText('');
    setStaffId('');
    setSelectedCC([]);
    onCancelEdit();
  };

return (
  // html for the UI
  <View style={styles.card}>
    <Text style={styles.subtitle}>{editItem ? "Edit a ticket" : "File a ticket"}</Text>

    {/* A picker for the program to choose between students */}
    <Picker
      selectedValue={puid}
      onValueChange={(value) => setPuid(value === "" ? "" : Number(value))}
    >
      <Picker.Item label="Select students" value="" />
      {students.map((s) => (
        <Picker.Item
          key={s.puid}
          label={`${s.name} (${s.puid})`}
          value={s.puid}
        />
      ))}
    </Picker>

    {/* Another picker for the program to choose between staffs */}
    <Picker
      selectedValue={staffId}
      onValueChange={(value) => setStaffId(value === "" ? "" : Number(value))}
    >
      <Picker.Item label="Select staff" value="" />
      {staffs.map((s) => (
        <Picker.Item
          key={s.staff_id}
          label={`${s.name} (${s.staff_id})`}
          value={s.staff_id}
        />
      ))}
    </Picker>

    {/* Text input for message */}
    <TextInput 
      style={[styles.input, { height: 60 }]} 
      placeholder="Message..." 
      value={text} 
      onChangeText={setText} 
      multiline 
    />
    
    {/* A place to choose single or multiple staffs to forward */}
    <View style={{ marginVertical: 10 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>CC to Staffs:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {staffs.map((s) => {
          const isSelected = selectedCC.includes(s.staff_id);
          return (
            <TouchableOpacity
              key={s.staff_id}
              onPress={() => toggleCC(s.staff_id)}
              style={{
                padding: 8,
                borderRadius: 5,
                backgroundColor: isSelected ? '#4CAF50' : '#eee',
              }}
            >
              <Text style={{ color: isSelected ? '#fff' : '#333', fontSize: 12 }}>
                {s.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>

    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1 }}>
        <Button 
          title={editItem ? "Update the ticket" : "File the ticket"} 
          onPress={handleSubmit} 
          color="#4CAF50" 
        />
      </View>
      {editItem && (
        <View style={{ flex: 1 }}>
          <Button title="Cancel" onPress={resetForm} color="#999" />
        </View>
      )}
    </View>
  </View>
);
}

// Main page
export default function TicketManagerScreen() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [reportInfo, setReportInfo] = useState({ total: 0, avgTextLen: 0 });
  
  const fetchTickets = async () => {
    setLoading(true);
    try {
      await initDatabase();
      const data = await getAllTicket();
      setTickets(data);
      
      if (data.length > 0) {
        const total = data.length;
        const avgLen = data.reduce((acc: number, curr: any) => acc + curr.conversation.length, 0) / total;
        setReportInfo({ total, avgTextLen: parseFloat(avgLen.toFixed(1)) });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete a ticket will also automatically delete all related data in the TICKET_CC table", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
          await deleteTicket(id);
          fetchTickets();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 0.5 }]}>{item.ticket_id}</Text>
      <Text style={styles.cell}>{item.puid}</Text>
      <Text style={[styles.cell, { flex: 1.5 }]} numberOfLines={1}>{item.conversation}</Text>
      <View style={{ flex: 1.5, flexDirection: 'row', gap: 5 }}>
        <TouchableOpacity onPress={() => setEditingItem(item)} style={styles.btnEdit}><Text style={styles.btnText}>Update</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.ticket_id)} style={styles.btnDel}><Text style={styles.btnText}>Delete</Text></TouchableOpacity>
      </View>
      <Text style={[styles.cell, { fontSize: 10 }]}>
        {item.start_timestamp ? item.start_timestamp : 'N/A'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Data Mine Ticket Management System</Text>
      
      <TicketForm 
        onSuccess={fetchTickets} 
        editItem={editingItem} 
        onCancelEdit={() => setEditingItem(null)} 
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>List of tickets</Text>
        <TouchableOpacity onPress={fetchTickets}><Text style={{ color: '#4A90E2' }}>Refresh</Text></TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <View style={styles.table}>
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.headerText, { flex: 0.5 }]}>Ticket_ID</Text>
            <Text style={[styles.cell, styles.headerText]}>Student_ID</Text>
            <Text style={[styles.cell, styles.headerText, { flex: 1.5 }]}>Message</Text>
            <Text style={[styles.cell, styles.headerText, { flex: 1.5 }]}>Update/Delete</Text>
            <Text style={[styles.cell, styles.headerText]}>Create Time</Text>
          </View>
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.ticket_id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.empty}>Empty</Text>}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 50, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  reportCard: { backgroundColor: '#e3f2fd', padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#bbdefb' },
  reportTitle: { fontWeight: 'bold', color: '#1976d2', marginBottom: 4 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 3 },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#4CAF50' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 5, padding: 8, marginBottom: 10, backgroundColor: '#fafafa' },
  table: { backgroundColor: '#fff', borderRadius: 8, flex: 1 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10, alignItems: 'center' },
  header: { backgroundColor: '#4A90E2' },
  headerText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  cell: { flex: 1, paddingHorizontal: 5, fontSize: 12, textAlign: 'center' },
  btnEdit: { backgroundColor: '#FF9800', padding: 6, borderRadius: 4 },
  btnDel: { backgroundColor: '#F44336', padding: 6, borderRadius: 4 },
  btnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  empty: { textAlign: 'center', padding: 20, color: '#999' }
});