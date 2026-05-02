import { initDatabase } from '@/src/database/database';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getAllStaff, getAllStudent, getTicketReport } from '../../src/database/db_operation';

export default function TicketReportScreen() {
  const [students, setStudents] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedStaffs, setSelectedStaffs] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  const [reportSummary, setReportSummary] = useState<any>(null);
  const [reportList, setReportList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);

  // Fetch all students and staffs for the user to choose.
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();

        const s = await getAllStudent();
        const st = await getAllStaff();

        setStudents(s || []);
        setStaffs(st || []);
      } catch (e) {
        console.error("Database initialization failed!");
      }
    };

    init();
  }, []);

  const toggleSelection = (id: number, list: number[], setList: (l: number[]) => void) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  // A function to generate report
  const generateReport = async () => {
    // First check if there is no empty parameters.
    if (selectedStudents.length == 0 || selectedStaffs.length == 0) {
      Alert.alert("You have to at least specify a student and staff");
      return;
    }

    // Start to generate report using the database operation.
    setLoading(true);
    try {
      const [summary, list] = await getTicketReport(
        selectedStudents,
        selectedStaffs,
        startDate,
        endDate
      );
      setReportSummary(summary);
      setReportList(list as any[]);
      setCurrentStep(1);
    } catch (error) {
      Alert.alert("Generating report failed!");
    } finally {
      setLoading(false);
    }
  };

  // One html to render the input.
  const renderConfigStep = () => (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionLabel}>Student:</Text>
        <ScrollView style={styles.chipScroll}>
          <View style={styles.chipContainer}>
            {students.map((s) => (
              <TouchableOpacity 
                key={s.puid} 
                style={[styles.chip, selectedStudents.includes(s.puid) && styles.chipSelected]}
                onPress={() => toggleSelection(s.puid, selectedStudents, setSelectedStudents)}
              >
                <Text style={styles.chipText}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.sectionLabel}>Teacher:</Text>
        <ScrollView style={styles.chipScroll}>
          <View style={styles.chipContainer}>
            {staffs.map((s) => (
              <TouchableOpacity 
                key={s.staff_id} 
                style={[styles.chip, selectedStaffs.includes(s.staff_id) && styles.chipSelectedStaff]}
                onPress={() => toggleSelection(s.staff_id, selectedStaffs, setSelectedStaffs)}
              >
                <Text style={styles.chipText}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.dateRow}>
          <TextInput 
            style={styles.dateInput} 
            value={startDate} 
            onChangeText={setStartDate} 
            placeholder="Start Date" 
          />
          <TextInput 
            style={styles.dateInput} 
            value={endDate} 
            onChangeText={setEndDate} 
            placeholder="End Date" 
          />
        </View>
      </View>

      <View style={styles.footerButton}>
        <Button title="Generate report" onPress={generateReport} color="#6200ee" />
      </View>
    </View>
  );

  // Another one to render the report.
  const renderResultStep = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Statistics</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{reportSummary?.totalTickets ?? 0}</Text>
            <Text style={styles.summaryLabel}>Total tickets</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{reportSummary?.avgMessageLength ?? 0}</Text>
            <Text style={styles.summaryLabel}>Average length</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{reportSummary?.ccPercentage ?? 0}%</Text>
            <Text style={styles.summaryLabel}>Forward rate</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={reportList}
        keyExtractor={(item) => item.ticket_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.ticketCard}>
            <Text style={{fontWeight: 'bold'}}>ID: {item.ticket_id}</Text>
            <Text style={{fontSize: 12}}>Content: {item.conversation}</Text>
          </View>
        )}
        style={{ flex: 1 }}
      />

      <View style={styles.footerButton}>
        <Button title="Cancel" onPress={() => setCurrentStep(0)} color="#666" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Report</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 50 }} />
      ) : (
        currentStep === 0 ? renderConfigStep() : renderResultStep()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16, paddingTop: 50 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  
  chipScroll: { maxHeight: 120, backgroundColor: '#fff', borderRadius: 8, padding: 5, marginBottom: 5 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { padding: 8, borderRadius: 15, backgroundColor: '#eee' },
  chipSelected: { backgroundColor: '#d1c4e9' },
  chipSelectedStaff: { backgroundColor: '#bbdefb' },
  chipText: { fontSize: 11 },

  dateRow: { flexDirection: 'row', gap: 10, marginVertical: 15 },
  dateInput: { flex: 1, borderBottomWidth: 1, borderColor: '#ccc', padding: 5 },
  
  footerButton: { paddingVertical: 10, borderTopWidth: 1, borderColor: '#eee' },

  summaryCard: { backgroundColor: '#6200ee', padding: 15, borderRadius: 10, marginBottom: 10 },
  summaryTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center' },
  summaryVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  summaryLabel: { color: '#ccc', fontSize: 10 },

  ticketCard: { backgroundColor: '#fff', padding: 10, borderRadius: 5, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#6200ee' }
});