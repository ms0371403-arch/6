import socket, sys, webbrowser, os
from http.server import HTTPServer, SimpleHTTPRequestHandler

# 確保控制台輸出 utf-8 不會因為 CP950 編碼報錯
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

PORT = 8080
ip = get_local_ip()
mobile_url = f"http://{ip}:{PORT}/index.html"
teacher_url = f"http://localhost:{PORT}/teacher.html?url={mobile_url}"

print("=" * 60)
print(" 汽車業務新人實戰挑戰 - 班級伺服器啟動成功！")
print("=" * 60)
print(f" 本地教師網址: http://localhost:{PORT}/index.html")
print(f" 手機掃描網址: {mobile_url}")
print(f" 教師投影大螢幕 (含 QR Code): {teacher_url}")
print("=" * 60)
print(" 提示：請確保學生的手機與本台電腦連接在相同的 Wi-Fi / 區域網路。")
print(" 按 Ctrl+C 可停止伺服器。")
print("=" * 60)

# 自動開啟教師投影大螢幕頁面
try:
    webbrowser.open(teacher_url)
except Exception:
    pass

class QuizHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), QuizHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n伺服器已停止。")
