import 'package:flutter/material.dart';
import '../models/quiz.dart';
import '../services/quiz_service.dart';

class QuizScreen extends StatefulWidget {
  final int quizId;
  final Map<String, dynamic>? quizData;
  const QuizScreen({super.key, required this.quizId, this.quizData});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  Quiz? _quiz;
  bool _loading = true;
  bool _takingQuiz = false;
  String? _error;
  List<int> _selectedAnswers = [];
  int _currentQuestion = 0;
  QuizResult? _result;

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final quiz = await QuizService.getQuiz(widget.quizId);
      setState(() {
        _quiz = quiz;
        _selectedAnswers = List.filled(
          quiz.questions?.length ?? 0,
          -1,
        );
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  void _startQuiz() {
    setState(() => _takingQuiz = true);
  }

  void _submitAnswer() {
    if (_currentQuestion < (_quiz?.questions?.length ?? 1) - 1) {
      setState(() => _currentQuestion++);
    }
  }

  void _prevQuestion() {
    if (_currentQuestion > 0) {
      setState(() => _currentQuestion--);
    }
  }

  void _submitQuiz() async {
    try {
      final result =
          await QuizService.submitQuiz(widget.quizId, _selectedAnswers);
      setState(() {
        _result = result;
        _takingQuiz = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_quiz?.title ?? 'Quiz'),
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
                          onPressed: _loadQuiz,
                          child: const Text('Coba Lagi')),
                    ],
                  ),
                )
              : _result != null
                  ? _buildResultView()
                  : _takingQuiz
                      ? _buildQuizView()
                      : _buildQuizIntro(),
    );
  }

  Widget _buildQuizIntro() {
    final questionCount = _quiz?.questions?.length ?? 0;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.quiz, size: 72, color: Colors.orange),
            const SizedBox(height: 16),
            Text(
              _quiz?.title ?? 'Quiz',
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            if (_quiz?.description != null) ...[
              const SizedBox(height: 8),
              Text(
                _quiz!.description!,
                style: TextStyle(color: Colors.grey[600]),
                textAlign: TextAlign.center,
              ),
            ],
            const SizedBox(height: 24),
            Text('$questionCount Pertanyaan'),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: _startQuiz,
              icon: const Icon(Icons.play_arrow),
              label: const Text('Mulai Quiz'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuizView() {
    final questions = _quiz?.questions ?? [];
    if (questions.isEmpty) {
      return const Center(child: Text('Tidak ada pertanyaan'));
    }
    final q = questions[_currentQuestion];

    return Column(
      children: [
        LinearProgressIndicator(
          value: (_currentQuestion + 1) / questions.length,
        ),
        Padding(
          padding: const EdgeInsets.all(8),
          child: Text(
            '${_currentQuestion + 1} / ${questions.length}',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  q.question,
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                ...List.generate(q.options.length, (index) {
                  final isSelected = _selectedAnswers[_currentQuestion] == index;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    color: isSelected
                        ? Theme.of(context)
                            .colorScheme
                            .primary
                            .withOpacity(0.1)
                        : null,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                      side: BorderSide(
                        color: isSelected
                            ? Theme.of(context).colorScheme.primary
                            : Colors.grey[300]!,
                      ),
                    ),
                    child: RadioListTile<int>(
                      value: index,
                      groupValue: _selectedAnswers[_currentQuestion],
                      onChanged: (val) {
                        setState(() {
                          _selectedAnswers[_currentQuestion] = val!;
                        });
                      },
                      title: Text(q.options[index]),
                      activeColor: Theme.of(context).colorScheme.primary,
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              if (_currentQuestion > 0)
                OutlinedButton(
                  onPressed: _prevQuestion,
                  child: const Text('Sebelumnya'),
                ),
              const Spacer(),
              if (_currentQuestion < questions.length - 1)
                ElevatedButton(
                  onPressed:
                      _selectedAnswers[_currentQuestion] >= 0
                          ? _submitAnswer
                          : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Selanjutnya'),
                )
              else
                ElevatedButton.icon(
                  onPressed: _selectedAnswers[_currentQuestion] >= 0
                      ? _submitQuiz
                      : null,
                  icon: const Icon(Icons.check),
                  label: const Text('Kumpulkan'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildResultView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.emoji_events, size: 72, color: Colors.amber),
            const SizedBox(height: 16),
            Text(
              'Quiz Selesai!',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 24),
            Text(
              '${_result!.score} / ${_result!.total}',
              style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Column(
              children: [
                Text('Benar: ${_result!.correct}',
                    style: TextStyle(color: Colors.green[700])),
                Text('Salah: ${_result!.incorrect}',
                    style: TextStyle(color: Colors.red[700])),
              ],
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Kembali'),
            ),
          ],
        ),
      ),
    );
  }
}
