// script.js - Browser-side AES-GCM (Web Crypto) encrypt/decrypt
// Helpers
const $ = id => document.getElementById(id);

function toBase64(buf){
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromBase64(b64){
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for(let i=0;i<len;i++) bytes[i]=binary.charCodeAt(i);
  return bytes.buffer;
}
async function sha256(str){
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}
async function importKeyFromPassphrase(passphrase){
  const hash = await sha256(passphrase); // 32 bytes
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt','decrypt']);
}

// UI setup
const btnType = $('btnType'), btnFile = $('btnFile');
const textArea = $('text-area'), fileArea = $('file-area');
btnType.onclick = () => { btnType.classList.add('active'); btnFile.classList.remove('active'); textArea.style.display='block'; fileArea.style.display='none'; };
btnFile.onclick = () => { btnFile.classList.add('active'); btnType.classList.remove('active'); textArea.style.display='none'; fileArea.style.display='block'; };

// File input parsing (if file contains both ciphertext & IV)
$('fileInput').addEventListener('change', function(){
  const file = this.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target.result;
    // Try regex parse like:
    // Encrypted Text:\n<base64>\n\nIV:\n<base64>
    const cipherMatch = content.match(/Encrypted Text:\s*([^\r\n]+)/i);
    const ivMatch = content.match(/IV:\s*([^\r\n]+)/i);
    if(cipherMatch && ivMatch){
      $('inputText').value = cipherMatch[1].trim();
      // store IV in result area or a hidden field; we'll place it in result's "iv" input — reusing resultText? we'll store iv in a small hidden element
      // For simplicity, append 'IV:<iv>' to the result area so decrypt uses it
      $('resultText').value = `IV:${ivMatch[1].trim()}`;
    } else {
      // fallback: put raw content into inputText
      $('inputText').value = content;
    }
  };
  reader.readAsText(file);
});

// Encrypt
$('encryptBtn').addEventListener('click', async () => {
  try {
    const plaintext = $('inputText').value || '';
    const pass = $('passphrase').value || '';
    if(!pass){ alert('Enter passphrase'); return; }

    const key = await importKeyFromPassphrase(pass);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit for GCM
    const encoded = new TextEncoder().encode(plaintext);

    const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, encoded);
    const ct_b64 = toBase64(ct);
    const iv_b64 = toBase64(iv.buffer);

    // Show result in the same format you used earlier
    $('resultText').value = `Encrypted Text:\n${ct_b64}\n\nIV:\n${iv_b64}`;
  } catch (err) {
    console.error(err);
    alert('Encryption failed: ' + err.message);
  }
});

// Decrypt
$('decryptBtn').addEventListener('click', async () => {
  try {
    const input = $('inputText').value || '';
    const pass = $('passphrase').value || '';
    if(!pass){ alert('Enter passphrase'); return; }

    // If the input contains the full format, try to extract ciphertext and iv
    let cipher_b64 = null, iv_b64 = null;
    const cipherMatch = input.match(/Encrypted Text:\s*([^\r\n]+)/i);
    const ivMatchInInput = input.match(/IV:\s*([^\r\n]+)/i);
    if(cipherMatch && ivMatchInInput){
      cipher_b64 = cipherMatch[1].trim();
      iv_b64 = ivMatchInInput[1].trim();
    } else {
      // maybe IV is in resultText (when file upload parsed IV into result area)
      const resultIvMatch = $('resultText').value.match(/IV:\s*([^\r\n]+)/i);
      if(resultIvMatch){
        iv_b64 = resultIvMatch[1].trim();
        cipher_b64 = input.trim();
      } else {
        // ask user to paste both
        const maybeCipher = prompt('No IV found. If your input is only ciphertext, paste the IV now (base64). Click Cancel to abort.');
        if(!maybeCipher) { alert('IV required for decryption'); return; }
        iv_b64 = maybeCipher.trim();
        cipher_b64 = input.trim();
      }
    }

    if(!cipher_b64 || !iv_b64){ 
        alert('Could not find ciphertext and IV'); 
        return; 
    }

    const key = await importKeyFromPassphrase(pass);
    const ctBuf = fromBase64(cipher_b64);
    const ivBuf = fromBase64(iv_b64);

    const plainBuf = await crypto.subtle.decrypt({ name:'AES-GCM', iv: new Uint8Array(ivBuf) }, key, ctBuf);
    const plaintext = new TextDecoder().decode(plainBuf);
    $('resultText').value = plaintext;
  } catch (err) {
    console.error(err);
    alert('Decryption failed: ' + err.message);
  }
});

// Save file
$('saveBtn').addEventListener('click', () => {
  const text = $('resultText').value;
  if(!text){ alert('Nothing to save'); return; }
  const blob = new Blob([text], { type:'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'encrypted_output.txt'; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
});

// Clear all inputs
$('clearBtn').addEventListener('click', () => {
  $('inputText').value = '';
  $('passphrase').value = '';
  $('resultText').value = '';
  $('fileInput').value = '';
});

