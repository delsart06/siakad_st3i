import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  divider: {
    borderBottom: '2pt solid #1e1b4b',
    marginBottom: 20,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  infoColumn: {
    width: '48%',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: '35%',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#64748b',
  },
  infoValue: {
    width: '65%',
    fontSize: 9,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#1e1b4b',
    borderRadius: 8,
  },
  statBox: {
    textAlign: 'center',
    minWidth: 80,
  },
  statLabel: {
    fontSize: 8,
    color: '#a5b4fc',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e1b4b',
    color: '#ffffff',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  colNo: { width: '5%', textAlign: 'center' },
  colKode: { width: '12%' },
  colNama: { width: '35%' },
  colSks: { width: '10%', textAlign: 'center' },
  colNilai: { width: '12%', textAlign: 'center' },
  colBobot: { width: '12%', textAlign: 'center' },
  colMutu: { width: '14%', textAlign: 'center' },
  nilaiA: {
    color: '#059669',
    fontFamily: 'Helvetica-Bold',
  },
  nilaiB: {
    color: '#2563eb',
    fontFamily: 'Helvetica-Bold',
  },
  nilaiC: {
    color: '#d97706',
    fontFamily: 'Helvetica-Bold',
  },
  nilaiD: {
    color: '#ea580c',
    fontFamily: 'Helvetica-Bold',
  },
  nilaiE: {
    color: '#dc2626',
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLeft: {
    width: '50%',
  },
  footerRight: {
    width: '40%',
    textAlign: 'center',
  },
  signature: {
    marginTop: 60,
    borderTop: '1pt solid #000',
    paddingTop: 4,
    fontSize: 9,
  },
  ipsNote: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    fontSize: 8,
    color: '#92400e',
  },
});

const getNilaiStyle = (nilai) => {
  if (!nilai) return {};
  if (nilai.startsWith('A')) return styles.nilaiA;
  if (nilai.startsWith('B')) return styles.nilaiB;
  if (nilai.startsWith('C')) return styles.nilaiC;
  if (nilai === 'D') return styles.nilaiD;
  return styles.nilaiE;
};

const getIPSLabel = (ips) => {
  if (ips >= 3.5) return 'Sangat Baik';
  if (ips >= 3.0) return 'Baik';
  if (ips >= 2.5) return 'Cukup';
  if (ips >= 2.0) return 'Kurang';
  return 'Perlu Perhatian';
};

const KHSPdf = ({ mahasiswa, tahunAkademik, khsData }) => {
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const totalMutu = khsData?.nilai?.reduce((sum, item) => sum + (item.mutu || 0), 0) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SEKOLAH TINGGI TEOLOGI TRANSFORMASI INDONESIA</Text>
          <Text style={styles.subtitle}>KARTU HASIL STUDI (KHS)</Text>
          <Text style={styles.subtitle}>
            {tahunAkademik?.tahun || '-'} - Semester {tahunAkademik?.semester || '-'}
          </Text>
        </View>
        <View style={styles.divider} />

        {/* Student Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>NIM</Text>
              <Text style={styles.infoValue}>: {mahasiswa?.nim || khsData?.mahasiswa?.nim || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoValue}>: {mahasiswa?.nama || khsData?.mahasiswa?.nama || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Program Studi</Text>
              <Text style={styles.infoValue}>: {mahasiswa?.prodi_nama || '-'}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tahun Masuk</Text>
              <Text style={styles.infoValue}>: {mahasiswa?.tahun_masuk || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>: {mahasiswa?.status || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dosen PA</Text>
              <Text style={styles.infoValue}>: {mahasiswa?.dosen_pa_nama || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total SKS</Text>
            <Text style={styles.statValue}>{khsData?.total_sks || 0}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>IPS</Text>
            <Text style={styles.statValue}>{khsData?.ips?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Predikat</Text>
            <Text style={styles.statValue}>{getIPSLabel(khsData?.ips || 0)}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colKode}>Kode MK</Text>
            <Text style={styles.colNama}>Nama Mata Kuliah</Text>
            <Text style={styles.colSks}>SKS</Text>
            <Text style={styles.colNilai}>Nilai</Text>
            <Text style={styles.colBobot}>Bobot</Text>
            <Text style={styles.colMutu}>Mutu</Text>
          </View>
          {(khsData?.nilai || []).map((item, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
              <Text style={styles.colNo}>{index + 1}</Text>
              <Text style={styles.colKode}>{item.kode_mk || '-'}</Text>
              <Text style={styles.colNama}>{item.nama_mk || '-'}</Text>
              <Text style={styles.colSks}>{item.sks || 0}</Text>
              <Text style={[styles.colNilai, getNilaiStyle(item.nilai_huruf)]}>
                {item.nilai_huruf || '-'}
              </Text>
              <Text style={styles.colBobot}>{item.bobot?.toFixed(1) || '-'}</Text>
              <Text style={styles.colMutu}>{item.mutu?.toFixed(2) || '-'}</Text>
            </View>
          ))}
          {/* Footer row */}
          <View style={styles.tableFooter}>
            <Text style={styles.colNo}></Text>
            <Text style={styles.colKode}></Text>
            <Text style={[styles.colNama, { textAlign: 'right', paddingRight: 10 }]}>TOTAL</Text>
            <Text style={styles.colSks}>{khsData?.total_sks || 0}</Text>
            <Text style={styles.colNilai}></Text>
            <Text style={styles.colBobot}></Text>
            <Text style={styles.colMutu}>{totalMutu.toFixed(2)}</Text>
          </View>
        </View>

        {/* IPS Note */}
        <View style={styles.ipsNote}>
          <Text>
            IPS (Indeks Prestasi Semester) = Total Mutu / Total SKS = {totalMutu.toFixed(2)} / {khsData?.total_sks || 0} = {khsData?.ips?.toFixed(2) || '0.00'}
          </Text>
        </View>

        {/* Footer with signature */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Dicetak pada: {printDate}</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={{ fontSize: 9 }}>Mengetahui,</Text>
            <Text style={{ fontSize: 9 }}>Kepala Bagian Akademik</Text>
            <Text style={styles.signature}>
              (________________________)
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default KHSPdf;
