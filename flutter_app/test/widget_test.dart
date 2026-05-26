import 'package:flutter_test/flutter_test.dart';
import 'package:portal_app/main.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(const PortalApp());
    expect(find.text('Portal Pembelajaran'), findsOneWidget);
  });
}
