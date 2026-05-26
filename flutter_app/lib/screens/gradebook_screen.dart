import 'package:flutter/material.dart';
import '../models/grade.dart';
import '../services/gradebook_service.dart';

class GradebookScreen extends StatefulWidget {
  final int courseId;
  const GradebookScreen({super.key, required this.courseId});

  @override
  State<GradebookScreen> createState() => _GradebookScreenState();
}

class _GradebookScreenState extends State<GradebookScreen> {
  Gradebook? _gradebook;
  bool _loading = true;
  String? _error;

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
      final gb = await GradebookService.getGradebook(widget.courseId);
      setState(() {
        _gradebook = gb;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_gradebook?.courseName ?? 'Nilai'),
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
              : Column(
                  children: [
                    Expanded(
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          _buildComponentsTable(),
                          const SizedBox(height: 24),
                          _buildFinalScore(),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildComponentsTable() {
    final components = _gradebook?.components ?? [];
    if (components.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text('Belum ada komponen nilai',
              style: TextStyle(color: Colors.grey)),
        ),
      );
    }

    return Card(
      elevation: 2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Komponen Penilaian',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
          const Divider(height: 1),
          ...components.map((c) => Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Text(c.name),
                    ),
                    Expanded(
                      flex: 1,
                      child: Text(
                        '${(c.weight * 100).toStringAsFixed(0)}%',
                        style: TextStyle(color: Colors.grey[600]),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    Expanded(
                      flex: 1,
                      child: Text(
                        c.score != null
                            ? c.score!.toStringAsFixed(1)
                            : '-',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: c.score != null
                              ? Theme.of(context).colorScheme.primary
                              : Colors.grey,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildFinalScore() {
    final hasScore = _gradebook?.finalScore != null;
    return Card(
      elevation: 3,
      color: hasScore
          ? Theme.of(context).colorScheme.primary.withOpacity(0.05)
          : null,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text(
              'Nilai Akhir',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              hasScore
                  ? _gradebook!.finalScore!.toStringAsFixed(2)
                  : 'Belum ada',
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: hasScore
                    ? Theme.of(context).colorScheme.primary
                    : Colors.grey,
              ),
            ),
            if (_gradebook?.letterGrade != null) ...[
              const SizedBox(height: 4),
              Text(
                _gradebook!.letterGrade!,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: _letterGradeColor(_gradebook!.letterGrade!),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _letterGradeColor(String grade) {
    if (grade.startsWith('A')) return Colors.green;
    if (grade.startsWith('B')) return Colors.blue;
    if (grade.startsWith('C')) return Colors.orange;
    return Colors.red;
  }
}
