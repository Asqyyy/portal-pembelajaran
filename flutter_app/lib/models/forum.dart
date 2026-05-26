class ForumThread {
  final int id;
  final int courseId;
  final String title;
  final String content;
  final int authorId;
  final String? authorName;
  final String? createdAt;
  final List<ForumReply>? replies;

  ForumThread({
    required this.id,
    required this.courseId,
    required this.title,
    required this.content,
    required this.authorId,
    this.authorName,
    this.createdAt,
    this.replies,
  });

  factory ForumThread.fromJson(Map<String, dynamic> json) => ForumThread(
        id: json['id'],
        courseId: json['course_id'] ?? json['courseId'] ?? 0,
        title: json['title'],
        content: json['content'] ?? '',
        authorId: json['author_id'] ?? json['authorId'] ?? 0,
        authorName: json['author_name'] ?? json['authorName'],
        createdAt: json['created_at'] ?? json['createdAt'],
        replies: json['replies'] != null
            ? (json['replies'] as List)
                .map((r) => ForumReply.fromJson(r))
                .toList()
            : null,
      );
}

class ForumReply {
  final int id;
  final int threadId;
  final String content;
  final int authorId;
  final String? authorName;
  final String? createdAt;

  ForumReply({
    required this.id,
    required this.threadId,
    required this.content,
    required this.authorId,
    this.authorName,
    this.createdAt,
  });

  factory ForumReply.fromJson(Map<String, dynamic> json) => ForumReply(
        id: json['id'],
        threadId: json['thread_id'] ?? json['threadId'] ?? 0,
        content: json['content'] ?? '',
        authorId: json['author_id'] ?? json['authorId'] ?? 0,
        authorName: json['author_name'] ?? json['authorName'],
        createdAt: json['created_at'] ?? json['createdAt'],
      );
}
