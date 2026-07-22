const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// Konfigurasi API
const API_BASE_URL = 'http://localhost:5009/api';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Simple memory session for state tracking
const userSessions = new Map();

const getSession = (phoneId) => {
    if (!userSessions.has(phoneId)) {
        userSessions.set(phoneId, { state: 'IDLE' });
    }
    return userSessions.get(phoneId);
};

const setSessionState = (phoneId, state, data = {}) => {
    const s = getSession(phoneId);
    s.state = state;
    s.data = { ...s.data, ...data };
};

const getStatusLabel = (status) => {
    switch(status) {
        case 'SUCCESS': return '✅ *BERHASIL*';
        case 'PENDING': return '⏳ *MENUNGGU PEMBAYARAN*';
        case 'PROCESSING': return '⚙️ *SEDANG DIPROSES*';
        case 'FAILED': return '❌ *GAGAL*';
        default: return status;
    }
};

const sendMainMenu = (msg) => {
    setSessionState(msg.from, 'IDLE'); // Reset state
    const menuMsg = `Halo! Selamat datang di layanan *SassyGurl Customer Service* 🌸\n` +
                    `Pusat Top-Up Game Termurah & Terpercaya.\n\n` +
                    `Silakan balas dengan *angka* menu di bawah ini:\n\n` +
                    `*[1]* 🔍 Lacak Pesanan\n` +
                    `*[2]* 💰 Cek Daftar Harga\n` +
                    `*[3]* ❓ Bantuan / FAQ\n` +
                    `*[4]* 👩‍💻 Chat Live Agent\n\n` +
                    `_Ketik angka (contoh: 1) lalu kirim._`;
    return msg.reply(menuMsg);
};

client.on('qr', (qr) => {
    console.log('\n=========================================');
    console.log('SCAN QR CODE INI MENGGUNAKAN WHATSAPP ANDA');
    console.log('Buka WA -> Perangkat Tertaut -> Tautkan Perangkat');
    console.log('=========================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ Bot WhatsApp (Enterprise) siap dan sudah terkoneksi!');
    console.log('Bot sekarang mendengarkan pesan masuk...');
});

// Auto-Reply Logic
client.on('message', async (msg) => {
    // Hindari membalas status/story atau pesan dari grup
    if (msg.isStatus || msg.from.includes('@g.us')) return;

    const text = msg.body.trim().toUpperCase();
    const session = getSession(msg.from);

    // --- DIRECT INVOICE CHECK (CEK INV-XXX) ---
    const cekMatch = text.match(/^(?:\/CEK|CEK)\s+(INV-\w+)$/i);
    if (cekMatch) {
        const invoiceId = cekMatch[1].toUpperCase();
        try {
            msg.reply('⏳ _Sedang mengecek status pesanan Anda..._');
            const response = await axios.get(`${API_BASE_URL}/Track/${invoiceId}`);
            if (response.data && response.data.success) {
                const data = response.data.data;
                const replyMsg = `*STATUS PESANAN SASSYGURL* 🌸\n\n` +
                                 `*Invoice:* ${data.invoiceId}\n` +
                                 `*Status:* ${getStatusLabel(data.status)}\n\n` +
                                 `_Terima kasih telah berbelanja di SassyGurl!_`;
                msg.reply(replyMsg);
            }
        } catch (error) {
            msg.reply('❌ *Pesanan tidak ditemukan atau sistem sibuk.*');
        }
        setSessionState(msg.from, 'IDLE');
        return;
    }

    // --- STATE ROUTING ---
    if (session.state === 'WAITING_FOR_INVOICE') {
        if (text === '0') return sendMainMenu(msg);
        
        const invoiceId = text;
        if (!invoiceId.startsWith('INV-')) {
            return msg.reply('❌ *Format Salah.*\nPastikan diawali dengan *INV-* (Contoh: INV-12345).\nSilakan ketik ulang, atau ketik *0* untuk Batal.');
        }

        try {
            msg.reply('⏳ _Sedang mengecek ke sistem..._');
            const response = await axios.get(`${API_BASE_URL}/Track/${invoiceId}`);
            
            if (response.data && response.data.success) {
                const data = response.data.data;
                const statusText = getStatusLabel(data.status);

                const replyMsg = `*STATUS PESANAN SASSYGURL* 🌸\n\n` +
                                 `*Invoice:* ${data.invoiceId}\n` +
                                 `*Produk:* ${data.productName}\n` +
                                 `*Game:* ${data.gameName}\n` +
                                 `*Tujuan:* ${data.playerId}\n` +
                                 `*Status:* ${statusText}\n\n` +
                                 `_Terima kasih telah berbelanja di SassyGurl!_`;
                msg.reply(replyMsg);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                msg.reply('❌ *Pesanan tidak ditemukan.*\nCek kembali nomor Anda. Ketik nomor invoice lagi, atau ketik *0* untuk kembali.');
                return;
            } else {
                msg.reply('⚠️ *Maaf, server sedang sibuk.*\nSilakan coba lagi nanti.');
            }
        }
        setSessionState(msg.from, 'IDLE');
        return;
    }
    
    if (session.state === 'WAITING_FOR_GAME_SELECTION') {
        if (text === '0') return sendMainMenu(msg);
        
        const selectionIndex = parseInt(text) - 1;
        const games = session.data.games || [];
        
        if (isNaN(selectionIndex) || selectionIndex < 0 || selectionIndex >= games.length) {
            return msg.reply('❌ *Pilihan tidak valid.*\nSilakan balas dengan angka game yang sesuai (Contoh: 1), atau ketik *0* untuk kembali.');
        }

        const selectedGame = games[selectionIndex];
        
        try {
            msg.reply(`⏳ _Mengambil harga untuk ${selectedGame.name}..._`);
            const res = await axios.get(`${API_BASE_URL}/Products?gameSlug=${selectedGame.slug}`);
            
            if (res.data && res.data.success) {
                const products = res.data.data;
                if (products.length === 0) {
                    msg.reply(`⚠️ Belum ada produk aktif untuk *${selectedGame.name}*.\n\nKetik *0* untuk kembali ke Menu Utama.`);
                    return;
                }

                let replyText = `💰 *DAFTAR HARGA: ${selectedGame.name.toUpperCase()}*\n\n`;
                const displayProducts = products.slice(0, 15);
                displayProducts.forEach(p => {
                    const rp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(p.finalPrice).replace(',00', '');
                    replyText += `💎 *${p.name}*\n     🏷️ ${rp}\n`;
                });
                
                if (products.length > 15) {
                    replyText += `\n_...dan masih banyak lagi!_\n`;
                }
                
                replyText += `\nUntuk membeli, silakan kunjungi website kami di:\n🌐 https://unpresentative-apolonia-otherwise.ngrok-free.dev/games/${selectedGame.slug}\n\n_Ketik 0 untuk kembali ke Menu Utama._`;
                msg.reply(replyText);
                setSessionState(msg.from, 'IDLE');
            }
        } catch (err) {
            msg.reply('⚠️ *Gagal mengambil daftar harga.*\nSistem sedang sibuk. Ketik *0* untuk kembali.');
        }
        return;
    }

    // --- IDLE MENU ROUTING ---
    if (text === '0') {
        return sendMainMenu(msg);
    }
    else if (text === '1') {
        setSessionState(msg.from, 'WAITING_FOR_INVOICE');
        return msg.reply(`🔍 *LACAK PESANAN*\n\nSilakan balas dengan *Nomor Invoice* Anda:\n_(Contoh: INV-878931)_\n\nKetik *0* untuk Batal.`);
    }
    else if (text === '2') {
        try {
            msg.reply('⏳ _Mengambil daftar game..._');
            const res = await axios.get(`${API_BASE_URL}/Catalog/games`);
            if (res.data && res.data.success) {
                const games = res.data.data.slice(0, 15);
                setSessionState(msg.from, 'WAITING_FOR_GAME_SELECTION', { games });
                
                let gameListText = `🎮 *PILIH GAME*\n\nSilakan balas dengan *angka* game di bawah ini:\n\n`;
                games.forEach((g, idx) => {
                    gameListText += `*[${idx + 1}]* ${g.name}\n`;
                });
                gameListText += `\n*[0]* Kembali ke Menu Utama`;
                
                return msg.reply(gameListText);
            }
        } catch (err) {
            return msg.reply('⚠️ Gagal memuat daftar game. Silakan coba beberapa saat lagi.');
        }
    }
    else if (text === '3') {
        const faq = `❓ *PUSAT BANTUAN SASSYGURL*\n\n` +
                    `*1. Berapa lama proses top up?*\n` +
                    `Proses otomatis kami biasanya memakan waktu 1-5 menit setelah pembayaran Anda kami terima.\n\n` +
                    `*2. Metode pembayaran apa saja yang tersedia?*\n` +
                    `Kami menerima QRIS, GoPay, OVO, Dana, ShopeePay, Transfer Bank (BCA, Mandiri, BNI, BRI), dan Alfamart.\n\n` +
                    `*3. Pesanan saya belum masuk?*\n` +
                    `Pastikan Anda sudah mentransfer sesuai nominal invoice (termasuk kode unik jika ada). Jika statusnya FAILED, hubungi CS kami. Saldo akan di-refund.\n\n` +
                    `*4. Apakah legal dan aman?*\n` +
                    `100% Legal dan Aman. SassyGurl menjamin akun Anda bebas dari banned.\n\n` +
                    `_Ketik 0 untuk kembali ke Menu Utama._`;
        return msg.reply(faq);
    }
    else if (text === '4') {
        return msg.reply(`👩‍💻 *LIVE AGENT SASSYGURL*\n\nAdmin kami selalu siap membantu Anda.\n*Jam Operasional:* 08:00 - 22:00 WIB\n\nSilakan ketik detail kendala Anda, lalu lampirkan *Nomor Invoice* dan Bukti Transfer. Admin kami akan segera merespons pesan Anda pada jam kerja.\n\n_Ketik 0 untuk kembali ke Menu Utama._`);
    }

    // --- GREETING FALLBACK ---
    const greetings = ['HALO', 'HI', 'HAI', 'P', 'PING', 'BANTUAN', 'MENU', 'HELP'];
    if (greetings.includes(text)) {
        return sendMainMenu(msg);
    } else if (session.state === 'IDLE') {
        // Only show hint if it's a completely unrecognized message and we are idle
        msg.reply("Maaf, SassyGurl Bot tidak mengerti. 🌸\n\nKetik *MENU* atau *HALO* untuk melihat pilihan layanan kami.");
    }
});

client.initialize();
