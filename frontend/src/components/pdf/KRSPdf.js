import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register font (using built-in fonts for simplicity)
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
  colNo: { width: '5%', textAlign: 'center' },
  colKode: { width: '12%' },
  colNama: { width: '30%' },
  colDosen: { width: '20%' },
  colJadwal: { width: '18%' },
  colSks: { width: '8%', textAlign: 'center' },
  colStatus: { width: '12%', textAlign: 'center' },
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
  summary: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  summaryItem: {
    marginLeft: 20,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e1b4b',
  },
  statusApproved: {
    color: '#059669',
    fontFamily: 'Helvetica-Bold',
  },
  statusPending: {
    color: '#d97706',
  },
  statusRejected: {
    color: '#dc2626',
  },
  printDate: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 10,
  },
});

const getStatusStyle = (status) => {
  switch (status) {
    case 'disetujui':
      return styles.statusApproved;
    case 'diajukan':
      return styles.statusPending;
    case 'ditolak':
      return styles.statusRejected;
    default:
      return {};
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'disetujui':
      return 'Disetujui';
    case 'diajukan':
      return 'Menunggu';
    case 'ditolak':
      return 'Ditolak';
    default:
      return status;
  }
};

const KRSPdf = ({ mahasiswa, tahunAkademik, krsData }) => {
  const totalSKS = krsData
    .filter(krs => krs.status !== 'ditolak')
    .reduce((sum, krs) => sum + (krs.sks || 0), 0);

  const approvedCount = krsData.filter(k => k.status === 'disetujui').length;
  const pendingCount = krsData.filter(k => k.status === 'diajukan').length;

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SEKOLAH TINGGI TEOLOGI TRANSFORMASI INDONESIA</Text>
          <Text style={styles.subtitle}>KARTU RENCANA STUDI (KRS)</Text>
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
              <Text style={styles.infoValue}>: {mahasiswa?.nim || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoValue}>: {mahasiswa?.nama || '-'}</Text>
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

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colKode}>Kode MK</Text>
            <Text style={styles.colNama}>Nama Mata Kuliah</Text>
            <Text style={styles.colDosen}>Dosen</Text>
            <Text style={styles.colJadwal}>Jadwal</Text>
            <Text style={styles.colSks}>SKS</Text>
            <Text style={styles.colStatus}>Status</Text>
          </View>
          {krsData.map((krs, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
              <Text style={styles.colNo}>{index + 1}</Text>
              <Text style={styles.colKode}>{krs.kode_mk || '-'}</Text>
              <Text style={styles.colNama}>{krs.mata_kuliah_nama || '-'}</Text>
              <Text style={styles.colDosen}>{krs.dosen_nama || '-'}</Text>
              <Text style={styles.colJadwal}>{krs.jadwal || '-'}</Text>
              <Text style={styles.colSks}>{krs.sks || 0}</Text>
              <Text style={[styles.colStatus, getStatusStyle(krs.status)]}>
                {getStatusText(krs.status)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total SKS</Text>
            <Text style={styles.summaryValue}>{totalSKS}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Disetujui</Text>
            <Text style={styles.summaryValue}>{approvedCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Menunggu</Text>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
          </View>
        </View>

        {/* Footer with signature */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Dicetak pada: {printDate}</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={{ fontSize: 9 }}>Mengetahui,</Text>
            <Text style={{ fontSize: 9 }}>Dosen Pembimbing Akademik</Text>
            <Text style={styles.signature}>
              ({mahasiswa?.dosen_pa_nama || '________________________'})
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default KRSPdf;
