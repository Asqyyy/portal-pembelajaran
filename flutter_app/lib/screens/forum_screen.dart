import 'package:flutter/material.dart';
import '../models/forum.dart';
import '../services/forum_service.dart';

class ForumScreen extends StatefulWidget {
  final int threadId;
  final Map<String, dynamic>? threadData;
  const ForumScreen({super.key, required this.threadId, this.threadData});

  @override
  State<ForumScreen> createState() => _ForumScreenState();
}

class _ForumScreenState extends State<ForumScreen> {
  ForumThread? _thread;
  bool _loading = true;
  String? _error;
  final _replyController = TextEditingController();
  bool _sendingReply = false;

  @override
  void initState() {
    super.initState();
    _loadThread();
  }

  Future<void> _loadThread() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final thread = await ForumService.getThread(widget.threadId);
      setState(() {
        _thread = thread;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  void _sendReply() async {
    final content = _replyController.text.trim();
    if (content.isEmpty) return;

    setState(() => _sendingReply = true);
    try {
      await ForumService.createReply(widget.threadId, content);
      _replyController.clear();
      await _loadThread();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Balasan terkirim')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _sendingReply = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Forum'),
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
                          onPressed: _loadThread,
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
                          _buildThreadCard(),
                          const SizedBox(height: 16),
                          Text(
                            'Balasan (${_thread?.replies?.length ?? 0})',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 8),
                          if (_thread?.replies == null ||
                              _thread!.replies!.isEmpty)
                            const Padding(
                              padding: EdgeInsets.all(24),
                              child: Center(
                                child: Text(
                                  'Belum ada balasan',
                                  style: TextStyle(color: Colors.grey),
                                ),
                              ),
                            )
                          else
                            ..._thread!.replies!
                                .map((reply) => _buildReplyCard(reply)),
                        ],
                      ),
                    ),
                    _buildReplyInput(),
                  ],
                ),
    );
  }

  Widget _buildThreadCard() {
    return Card(
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _thread?.title ?? '',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'oleh ${_thread?.authorName ?? 'Anonim'}',
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
            const Divider(),
            Text(_thread?.content ?? ''),
          ],
        ),
      ),
    );
  }

  Widget _buildReplyCard(ForumReply reply) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.person, size: 16, color: Colors.blue),
                const SizedBox(width: 4),
                Text(
                  reply.authorName ?? 'Anonim',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const Spacer(),
                if (reply.createdAt != null)
                  Text(
                    reply.createdAt!,
                    style: TextStyle(color: Colors.grey[500], fontSize: 11),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(reply.content),
          ],
        ),
      ),
    );
  }

  Widget _buildReplyInput() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _replyController,
              decoration: const InputDecoration(
                hintText: 'Tulis balasan...',
                border: OutlineInputBorder(),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              minLines: 1,
              maxLines: 3,
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: _sendingReply ? null : _sendReply,
            icon: _sendingReply
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.send),
            color: Theme.of(context).colorScheme.primary,
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }
}
