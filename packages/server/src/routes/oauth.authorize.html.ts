export function renderAuthorizePage(params: {
  googleClientId: string;
  serverUrl: string;
  sessionKey: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ordinary Note - 로그인</title>
  <script src="https://accounts.google.com/gsi/client" async></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
      width: 90%;
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #666; margin-bottom: 1.5rem; font-size: 0.9rem; }
    #g_id_onload { display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Ordinary Note</h1>
    <p>MCP 클라이언트 인증을 위해 Google 계정으로 로그인하세요.</p>
    <div id="g_id_onload"
      data-client_id="${escapeAttr(params.googleClientId)}"
      data-callback="handleCredentialResponse"
      data-auto_prompt="false">
    </div>
    <div class="g_id_signin"
      data-type="standard"
      data-size="large"
      data-theme="outline"
      data-text="sign_in_with"
      data-shape="rectangular"
      data-logo_alignment="left">
    </div>
  </div>

  <form id="callback-form" method="POST" action="${escapeAttr(params.serverUrl)}/oauth/callback" style="display:none;">
    <input type="hidden" name="sessionKey" value="${escapeAttr(params.sessionKey)}" />
    <input type="hidden" name="credential" id="credential" />
  </form>

  <script>
    function handleCredentialResponse(response) {
      document.getElementById('credential').value = response.credential;
      document.getElementById('callback-form').submit();
    }
  </script>
</body>
</html>`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
