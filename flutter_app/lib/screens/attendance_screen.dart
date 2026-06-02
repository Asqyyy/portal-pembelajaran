import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../models/attendance.dart';
import '../services/attendance_service.dart';
import '../services/auth_service.dart';
import '../models/user.dart';

class AttendanceScreen extends StatefulWidget {
  final int courseId;
  final String courseCode; // We need courseCode for generating/recording
  const AttendanceScreen({super.key, required this.courseId, required this.courseCode});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  List<AttendanceRecord> _records = [];
  bool _loading = true;
  String? _error;
  String? _qrToken;
  bool _generatingQR = false;
  User? _user;
  bool _isScanning = false;
  bool _recording = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final user = await AuthService.getSavedUser();
      final records = await AttendanceService.getRecords(widget.courseCode);
      setState(() {
        _user = user;
        _records = records;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  void _generateQR() async {
    setState(() => _generatingQR = true);
    try {
      final session = await AttendanceService.generateQR(widget.courseCode);
      setState(() {
        _qrToken = session.token;
        _generatingQR = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
      setState(() => _generatingQR = false);
    }
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_recording) return;
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null) {
        setState(() {
          _recording = true;
          _isScanning = false; // Close scanner
        });
        
        try {
          final Map<String, dynamic> data = jsonDecode(code);
          if (data['courseCode'] == widget.courseCode && data['token'] != null) {
            await AttendanceService.recordAttendance(widget.courseCode, data['token']);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('✅ Absen berhasil! Kehadiran tercatat.'), backgroundColor: Colors.green),
              );
            }
            await _load();
          } else {
            throw Exception('QR Code tidak valid untuk mata pelajaran ini');
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('⚠️ Gagal absen: ${e.toString().replaceFirst('Exception: ', '')}'), backgroundColor: Colors.red),
            );
          }
        } finally {
          setState(() => _recording = false);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLecturer = _user?.role == 'lecturer';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Presensi'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 8),
                      ElevatedButton(onPressed: _load, child: const Text('Coba Lagi')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      isLecturer ? _buildQRGenerator() : _buildQRScanner(),
                      const SizedBox(height: 24),
                      const Text(
                        'Riwayat Presensi',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 12),
                      if (_records.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: Text('Belum ada catatan presensi', style: TextStyle(color: Colors.grey)),
                          ),
                        )
                      else
                        ..._records.map((r) => _buildRecordCard(r)),
                    ],
                  ),
                ),
    );
  }

  Widget _buildQRGenerator() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Icon(Icons.qr_code, size: 48, color: Colors.purple),
            const SizedBox(height: 8),
            const Text('QR Code Presensi', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            if (_qrToken != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                  color: Colors.white,
                ),
                child: Column(
                  children: [
                    QrImageView(
                      data: jsonEncode({
                        'courseCode': widget.courseCode,
                        'token': _qrToken,
                      }),
                      version: QrVersions.auto,
                      size: 200.0,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Token: $_qrToken',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _generatingQR ? null : _generateQR,
              icon: _generatingQR
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.refresh),
              label: Text(_qrToken != null ? 'Generate Ulang' : 'Generate QR Code'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQRScanner() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Icon(Icons.qr_code_scanner, size: 48, color: Colors.blue),
            const SizedBox(height: 8),
            const Text('Absensi QR', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text(
              'Scan QR Code yang ditampilkan pengajar untuk mencatat kehadiran.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            if (_isScanning) ...[
              SizedBox(
                height: 300,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: MobileScanner(
                    onDetect: _onDetect,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: () => setState(() => _isScanning = false),
                icon: const Icon(Icons.close),
                label: const Text('Batal Scan'),
                style: TextButton.styleFrom(foregroundColor: Colors.red),
              ),
            ] else ...[
              ElevatedButton.icon(
                onPressed: _recording ? null : () => setState(() => _isScanning = true),
                icon: _recording
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.camera_alt),
                label: Text(_recording ? 'Mencatat...' : 'Buka Kamera & Scan'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRecordCard(AttendanceRecord record) {
    // Determine if it's the current user's record or others (lecturer sees all)
    final isPresent = true; // Simplification as all records in DB are present
    
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const Icon(Icons.check_circle, color: Colors.green),
        title: Text(record.studentName),
        subtitle: Text(record.date),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Text(
            'Hadir',
            style: TextStyle(
              color: Colors.green,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}
