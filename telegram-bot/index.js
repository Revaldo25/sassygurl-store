require('dotenv').config();
const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');

const token = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5009/api';
let FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not defined in .env file');
    process.exit(1);
}

const bot = new Telegraf(token);

// Simple memory session for state tracking
const userSessions = new Map();

const getSession = (userId) => {
    if (!userSessions.has(userId)) {
        userSessions.set(userId, { state: 'IDLE' });
    }
    return userSessions.get(userId);
};

const setSessionState = (userId, state, data = {}) => {
    const s = getSession(userId);
    s.state = state;
    s.data = { ...s.data, ...data };
};

// Helper for escaping MarkdownV2
const escapeMD = (text) => {
    if (!text) return '';
    return text.toString().replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
};

const getStatusLabel = (status) => {
    switch(status) {
        case 'SUCCESS': return '✅ *BERHASIL*';
        case 'PENDING': return '⏳ *MENUNGGU PEMBAYARAN*';
        case 'PROCESSING': return '⚙️ *SEDANG DIPROSES*';
        case 'FAILED': return '❌ *GAGAL*';
        default: return escapeMD(status);
    }
};

const sendMainMenu = (ctx) => {
    setSessionState(ctx.from.id, 'IDLE'); // Reset state
    const firstName = escapeMD(ctx.from.first_name || 'Kak');
    
    const msg = `Halo *${firstName}*\\! Selamat datang di layanan *SassyGurl Customer Service* 🌸\n\n` +
                `Pusat Top\\-Up Game Termurah & Terpercaya\\.\n` +
                `Silakan pilih menu layanan kami di bawah ini:`;

    return ctx.replyWithMarkdownV2(
        msg,
        Markup.inlineKeyboard([
            [Markup.button.callback('🔍 Lacak Pesanan', 'menu_cek_pesanan')],
            [Markup.button.callback('💰 Cek Daftar Harga', 'menu_harga')],
            [
                Markup.button.callback('❓ Bantuan (FAQ)', 'menu_faq'),
                Markup.button.url('🎮 Buka Web Katalog', FRONTEND_URL)
            ],
            [Markup.button.url('👩‍💻 Chat Live Agent (WA)', 'https://wa.me/6282374623877')]
        ])
    );
};

bot.start((ctx) => sendMainMenu(ctx));
bot.help((ctx) => sendMainMenu(ctx));
bot.command('menu', (ctx) => sendMainMenu(ctx));

// --- FEATURE 1: CEK PESANAN ---
bot.action('menu_cek_pesanan', async (ctx) => {
    await ctx.answerCbQuery();
    setSessionState(ctx.from.id, 'WAITING_FOR_INVOICE');
    await ctx.replyWithMarkdownV2(
        `🔍 *LACAK PESANAN*\n\nSilakan ketikkan *Nomor Invoice* Anda di bawah ini:\n_\\(Contoh: INV\\-878931\\)_`,
        Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Kembali ke Menu Utama', 'menu_utama')]
        ])
    );
});

// --- FEATURE 2: DAFTAR HARGA ---
bot.action('menu_harga', async (ctx) => {
    await ctx.answerCbQuery();
    try {
        const res = await axios.get(`${API_BASE_URL}/Catalog/games`);
        if (res.data && res.data.success) {
            const games = res.data.data.slice(0, 10); // Show top 10 to fit in TG keyboard
            
            const buttons = games.map(g => [Markup.button.callback(`🎮 ${g.name}`, `price_${g.slug}`)]);
            buttons.push([Markup.button.callback('⬅️ Kembali ke Menu Utama', 'menu_utama')]);
            
            await ctx.editMessageText(
                `💰 *CEK DAFTAR HARGA*\n\nSilakan pilih Game yang ingin Anda cek harganya:`,
                {
                    parse_mode: 'MarkdownV2',
                    reply_markup: { inline_keyboard: buttons }
                }
            );
        }
    } catch (err) {
        await ctx.reply('⚠️ Gagal mengambil daftar game dari server.');
    }
});

// Handling price selection
bot.action(/^price_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const gameSlug = ctx.match[1];
    
    try {
        const res = await axios.get(`${API_BASE_URL}/Products?gameSlug=${gameSlug}`);
        if (res.data && res.data.success) {
            const products = res.data.data;
            if (products.length === 0) {
                return ctx.editMessageText('⚠️ Belum ada produk untuk game ini.', Markup.inlineKeyboard([
                    [Markup.button.callback('⬅️ Kembali', 'menu_harga')]
                ]));
            }

            // Format price list
            let text = `💰 *DAFTAR HARGA SASSYGURL*\n\n`;
            
            // Show only top 15 to avoid massive messages
            const displayProducts = products.slice(0, 15);
            displayProducts.forEach(p => {
                const rp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(p.finalPrice).replace(',00', '');
                text += `💎 *${escapeMD(p.name)}*\n`;
                text += `     🏷️ Harga: *${escapeMD(rp)}*\n`;
            });
            
            if (products.length > 15) {
                text += `\n_\\.\\.\\.dan masih banyak lagi\\! Cek web SassyGurl untuk lengkapnya\\._\n`;
            }

            await ctx.editMessageText(text, {
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    inline_keyboard: [
                        [Markup.button.url('🛒 Beli Sekarang di Web', `${FRONTEND_URL}/games/${gameSlug}`)],
                        [Markup.button.callback('⬅️ Kembali ke Daftar Game', 'menu_harga')]
                    ]
                }
            });
        }
    } catch (err) {
        await ctx.reply('⚠️ Gagal mengambil daftar harga dari server.');
    }
});

// --- FEATURE 3: FAQ ---
bot.action('menu_faq', async (ctx) => {
    await ctx.answerCbQuery();
    const faq = `❓ *PUSAT BANTUAN SASSYGURL*\n\n` +
                `*1\\. Berapa lama proses top up?*\n` +
                `Proses otomatis kami biasanya memakan waktu 1\\-5 menit setelah pembayaran berhasil dikonfirmasi\\.\n\n` +
                `*2\\. Metode pembayaran apa saja yang tersedia?*\n` +
                `Kami menerima QRIS, GoPay, OVO, Dana, ShopeePay, Virtual Account BCA/Mandiri/BNI/BRI, dan Alfamart\\.\n\n` +
                `*3\\. Pesanan saya belum masuk?*\n` +
                `Silakan gunakan menu Cek Pesanan untuk melihat status terkini\\. Jika statusnya FAILED/Error, saldo akan dikembalikan, atau hubungi CS kami dengan menyertakan Nomor Invoice\\.\n\n` +
                `*4\\. Apakah legal dan aman?*\n` +
                `100% Legal dan Aman\\. SassyGurl menjamin akun Anda bebas dari banned karena kami hanya memproses pesanan melalui jalur resmi\\.`;

    await ctx.editMessageText(faq, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
            inline_keyboard: [
                [Markup.button.callback('⬅️ Kembali ke Menu Utama', 'menu_utama')]
            ]
        }
    });
});

// --- BACK TO MAIN MENU ---
bot.action('menu_utama', async (ctx) => {
    await ctx.answerCbQuery();
    setSessionState(ctx.from.id, 'IDLE');
    
    const firstName = escapeMD(ctx.from.first_name || 'Kak');
    const msg = `Halo *${firstName}*\\! Selamat datang di layanan *SassyGurl Customer Service* 🌸\n\n` +
                `Pusat Top\\-Up Game Termurah & Terpercaya\\.\n` +
                `Silakan pilih menu layanan kami di bawah ini:`;

    await ctx.editMessageText(msg, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
            inline_keyboard: [
                [Markup.button.callback('🔍 Lacak Pesanan', 'menu_cek_pesanan')],
                [Markup.button.callback('💰 Cek Daftar Harga', 'menu_harga')],
                [
                    Markup.button.callback('❓ Bantuan (FAQ)', 'menu_faq'),
                    Markup.button.url('🎮 Buka Web Katalog', FRONTEND_URL)
                ],
                [Markup.button.url('👩‍💻 Chat Live Agent (WA)', 'https://wa.me/6282374623877')]
            ]
        }
    });
});

// --- HANDLE FREE TEXT ---
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const session = getSession(ctx.from.id);

    // If waiting for invoice
    if (session.state === 'WAITING_FOR_INVOICE') {
        const invoiceId = text.toUpperCase();
        if (!invoiceId.startsWith('INV-')) {
            return ctx.replyWithMarkdownV2('❌ *Format Salah*\\.\nPastikan diawali dengan *INV\\-* \\(Contoh: INV\\-12345\\)\\.\nSilakan ketik ulang:');
        }

        try {
            const loadingMsg = await ctx.replyWithMarkdownV2('⏳ _Sedang mengecek ke sistem\\.\\.\\._');
            const response = await axios.get(`${API_BASE_URL}/Track/${invoiceId}`);
            
            if (response.data && response.data.success) {
                const data = response.data.data;
                const statusText = getStatusLabel(data.status);

                const replyMsg = `*STATUS PESANAN SASSYGURL* 🌸\n\n` +
                                 `*Invoice:* \`${escapeMD(data.invoiceId)}\`\n` +
                                 `*Produk:* ${escapeMD(data.productName)}\n` +
                                 `*Game:* ${escapeMD(data.gameName)}\n` +
                                 `*Tujuan:* \`${escapeMD(data.playerId)}\`\n` +
                                 `*Status:* ${statusText}\n\n` +
                                 `_Terima kasih telah berbelanja di SassyGurl\\!_`;
                                 
                await ctx.telegram.editMessageText(
                    ctx.chat.id,
                    loadingMsg.message_id,
                    undefined,
                    replyMsg,
                    { 
                        parse_mode: 'MarkdownV2',
                        reply_markup: {
                            inline_keyboard: [
                                [Markup.button.callback('⬅️ Kembali ke Menu Utama', 'menu_utama')]
                            ]
                        }
                     }
                );
            }
            // Reset state
            setSessionState(ctx.from.id, 'IDLE');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                await ctx.replyWithMarkdownV2('❌ *Pesanan tidak ditemukan\\.*\nCek kembali nomor Anda\\. Silakan ketik ulang atau pilih menu lain:', Markup.inlineKeyboard([
                    [Markup.button.callback('Batal & Kembali', 'menu_utama')]
                ]));
            } else {
                await ctx.replyWithMarkdownV2('⚠️ *Maaf, server sedang sibuk\\.*\nSilakan coba lagi nanti\\.', Markup.inlineKeyboard([
                    [Markup.button.callback('Batal & Kembali', 'menu_utama')]
                ]));
                setSessionState(ctx.from.id, 'IDLE');
            }
        }
        return;
    }

    // Accept /cek INV-XXXX format explicitly from anywhere
    const cekMatch = text.match(/^(?:\/cek|cek|CEK)\s+(INV-\w+)$/i);
    if (cekMatch) {
        const invoiceId = cekMatch[1].toUpperCase();
        try {
            const loadingMsg = await ctx.replyWithMarkdownV2('⏳ _Sedang mengecek status pesanan Anda\\.\\.\\._');
            const response = await axios.get(`${API_BASE_URL}/Track/${invoiceId}`);
            if (response.data && response.data.success) {
                const data = response.data.data;
                const replyMsg = `*STATUS PESANAN SASSYGURL* 🌸\n\n` +
                                 `*Invoice:* \`${escapeMD(data.invoiceId)}\`\n` +
                                 `*Status:* ${getStatusLabel(data.status)}\n\n` +
                                 `_Terima kasih telah berbelanja di SassyGurl\\!_`;
                await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, undefined, replyMsg, { parse_mode: 'MarkdownV2' });
            }
        } catch (error) {
            await ctx.replyWithMarkdownV2('❌ *Pesanan tidak ditemukan atau sistem sibuk\\.*');
        }
        return;
    }

    // Handle generic greetings if idle
    const greetings = ['HALO', 'HI', 'HAI', 'P', 'PING', 'BANTUAN', 'MENU'];
    if (greetings.includes(text.toUpperCase())) {
        return sendMainMenu(ctx);
    } else {
        return ctx.replyWithMarkdownV2(
            "Maaf, saya tidak mengerti perintah tersebut\\. 🌸\n\nSilakan klik tombol /menu di bawah untuk melihat pilihan bantuan\\.",
            Markup.inlineKeyboard([
                [Markup.button.callback('Tampilkan Menu Utama', 'menu_utama')]
            ])
        );
    }
});

bot.launch().then(() => {
    console.log('\n=========================================');
    console.log('✅ BOT TELEGRAM ENTERPRISE BERHASIL AKTIF');
    console.log(`URL Frontend : ${FRONTEND_URL}`);
    console.log(`URL Backend  : ${API_BASE_URL}`);
    console.log('=========================================\n');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
