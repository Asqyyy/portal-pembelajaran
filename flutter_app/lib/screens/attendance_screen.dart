import 'package:flutter/material.dart';
import '../models/attendance.dart';
import '../services/attendance_service.dart';

class AttendanceScreen extends StatefulWidget {
  final int courseId;
  const AttendanceScreen({super.key, required this.courseId});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  List<AttendanceRecord> _records = [];
  bool _loading = true;
  String? _error;
  String? _qrToken;
  bool _generatingQR = false;

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
      final records =
          await AttendanceService.getRecords(widget.courseId);
      setState(() {
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
      final session =
          await AttendanceService.generateQR(widget.courseId);
      setState(() {
        _qrToken = session.token;
        _generatingQR = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  e.toString().replaceFirst('Exception: ', ''))),
        );
      }
      setState(() => _generatingQR = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                      ElevatedButton(
                          onPressed: _load,
                          child: const Text('Coba Lagi')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildQRCard(),
                      const SizedBox(height: 24),
                      const Text(
                        'Riwayat Presensi',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (_records.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: Text(
                              'Belum ada catatan presensi',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ),
                        )
                      else
                        ..._records.map((r) => _buildRecordCard(r)),
                    ],
                  ),
                ),
    );
  }

  Widget _buildQRCard() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Icon(Icons.qr_code, size: 48, color: Colors.purple),
            const SizedBox(height: 8),
            const Text(
              'QR Code Presensi',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (_qrToken != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    // Show QR token as text (qr_flutter may not be available on all platforms)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.black),
                      ),
                      child: const Icon(Icons.qr_code_2,
                          size: 120, color: Colors.black),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Token: $_qrToken',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontFamily: 'monospace',
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Bagikan token ini ke mahasiswa',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _generatingQR ? null : _generateQR,
              icon: _generatingQR
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh),
              label: Text(_qrToken != null
                  ? 'Generate Ulang'
                  : 'Generate QR Code'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordCard(AttendanceRecord record) {
    final isPresent = record.status == 'present';
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(
          isPresent ? Icons.check_circle : Icons.cancel,
          color: isPresent ? Colors.green : Colors.red,
        ),
        title: Text(record.courseName),
        subtitle: Text(record.date),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: isPresent
                ? Colors.green.withOpacity(0.1)
                : Colors.red.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            isPresent ? 'Hadir' : record.status,
            style: TextStyle(
              color: isPresent ? Colors.green : Colors.red,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}
