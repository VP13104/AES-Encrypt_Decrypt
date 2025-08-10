# 🔐 AES-GCM Encryption & Decryption (JavaScript / Web Crypto API)
A pure browser-based encryption and decryption tool built using the Web Crypto API.
No backend is required — all encryption and decryption happens locally in the user’s browser, ensuring maximum privacy.

---

## 📌 Features
- **AES-GCM** mode for strong encryption and authentication.
- 256-bit key generation using **PBKDF2** from a user-provided password.
- Random salt and IV generation for every encryption.
- Base64 encoding for safe text storage and transfer.
- Secure decryption with authentication tag verification.
- 100% client-side — no data leaves your device.

---

## 🛠 Tech Stack
Language: JavaScript
API: Web Crypto API (window.crypto.subtle)
Encoding: UTF-8 & Base64

---

## ⚙️ Installation 

# 1️⃣ Clone the Repository
git clone https://github.com/VP13104/AES-Encrypt_Decrypt.git <br>
cd AES-Encrypt_Decrypt <br>
Open index.html with any browser <br>

## 🚀 Usage
Encryption

Enter the text you want to encrypt.

Provide a password/key.

Click Encrypt.

The tool will display:

Encrypted text (Base64)

IV (Initialization Vector — required for decryption)

Decryption

Paste the encrypted text and the IV from the encryption step.

Enter the same password/key.

Click Decrypt to get back the original message.
