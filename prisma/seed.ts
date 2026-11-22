import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";

const prisma = createPrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  const adminName =
    process.env.SEED_ADMIN_NAME?.trim() || "Pengelola TEMANSPACE.ID";

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diatur di .env sebelum menjalankan seed."
    );
  }

  // 1. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { code: "ADMIN" },
    update: {
      name: "Administrator",
      description:
        "Mengelola persetujuan pendaftaran siswa, materi edukasi, kuis, skenario, panduan bantuan, dan audit log.",
    },
    create: {
      code: "ADMIN",
      name: "Administrator",
      description:
        "Mengelola persetujuan pendaftaran siswa, materi edukasi, kuis, skenario, panduan bantuan, dan audit log.",
    },
  });

  await prisma.role.upsert({
    where: { code: "STUDENT" },
    update: {
      name: "Siswa",
      description:
        "Mengakses materi edukasi pertemanan sehat, kuis, skenario interaktif, dan panduan mencari bantuan.",
    },
    create: {
      code: "STUDENT",
      name: "Siswa",
      description:
        "Mengakses materi edukasi pertemanan sehat, kuis, skenario interaktif, dan panduan mencari bantuan.",
    },
  });

  // 2. Seed Initial Admin (never exposed via public registration)
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const adminPasswordHash = await hashPassword(adminPassword);
  const adminUser = existingAdmin
    ? await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          fullName: adminName,
          roleId: adminRole.id,
          status: "approved",
          passwordHash: adminPasswordHash,
        },
      })
    : await prisma.user.create({
        data: {
          roleId: adminRole.id,
          fullName: adminName,
          email: adminEmail,
          gradeLevel: null,
          passwordHash: adminPasswordHash,
          status: "approved",
        },
      });

  // 3. Seed 6 Core Material Categories
  const categoriesData = [
    {
      slug: "pertemanan-sehat",
      name: "Pertemanan Sehat",
      description:
        "Memahami arti pertemanan sehat, ciri-ciri hubungan saling menghargai, dan cara saling mendukung di sekolah maupun sehari-hari.",
      iconName: "heart-handshake",
      sortOrder: 1,
    },
    {
      slug: "relasi-tidak-sehat",
      name: "Kenali Relasi Tidak Sehat",
      description:
        "Mengenali perilaku tidak aman seperti mengejek, mengontrol berlebihan, mengucilkan, mengancam, memaksa, dan perundungan.",
      iconName: "shield-alert",
      sortOrder: 2,
    },
    {
      slug: "komunikasi-interpersonal",
      name: "Komunikasi Interpersonal",
      description:
        "Belajar mendengarkan secara aktif, menyampaikan pendapat dengan sopan, dan menghargai perbedaan antar teman.",
      iconName: "messages-square",
      sortOrder: 3,
    },
    {
      slug: "komunikasi-asertif",
      name: "Ngobrol dengan Asertif",
      description:
        "Mengenal komunikasi asertif dan berlatih langkah sederhana menggunakan pola kalimat \"Aku merasa... ketika...\".",
      iconName: "message-circle-check",
      sortOrder: 4,
    },
    {
      slug: "belajar-empati",
      name: "Belajar Empati",
      description:
        "Melatih kepekaan untuk memahami perasaan teman, mendengarkan tanpa menghakimi, dan memberi dukungan yang tepat.",
      iconName: "hand-heart",
      sortOrder: 5,
    },
    {
      slug: "menghadapi-konflik",
      name: "Menghadapi Konflik",
      description:
        "Langkah aman mengelola perbedaan pendapat: menenangkan diri, mendengarkan, menyampaikan maksud, dan mencari kesepakatan.",
      iconName: "scale",
      sortOrder: 6,
    },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const record = await prisma.materialCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        iconName: cat.iconName,
        sortOrder: cat.sortOrder,
        isPublished: true,
      },
      create: {
        ...cat,
        isPublished: true,
      },
    });
    categoryMap[cat.slug] = record.id;
  }

  // 4. Seed Materials (2 structured lessons per category = 12 lessons)
  const materialsData = [
    {
      categorySlug: "pertemanan-sehat",
      slug: "apa-itu-pertemanan-sehat",
      title: "Apa Itu Pertemanan Sehat?",
      summary:
        "Mengenal dasar hubungan pertemanan yang membuat kamu merasa aman, dihargai, dan bebas menjadi diri sendiri.",
      readingMinutes: 5,
      sortOrder: 1,
      content: `Pertemanan sehat adalah hubungan antara dua orang atau lebih yang dibangun di atas rasa saling menghormati, percaya, dan peduli. Di usia SMP, teman sebaya sering menjadi tempat berbagi cerita, belajar bersama, dan mencoba hal-hal baru.

Dalam pertemanan yang sehat, kamu tidak perlu berpura-pura menjadi orang lain agar diterima. Kamu dan temanmu sama-sama merasa nyaman untuk menyampaikan pendapat, memiliki ruang pribadi, serta saling mendukung saat senang maupun sulit.

Sebaliknya, berteman bukan berarti harus selalu setuju dalam segala hal. Perbedaan selera, hobi, atau pendapat itu wajar. Yang membuat pertemanan tetap sehat adalah cara kalian menghargai perbedaan tersebut tanpa merendahkan satu sama lain.`,
      keyPoints: [
        "Rasa aman: kamu tidak takut diejek atau dipermalukan ketika bercerita.",
        "Kesetaraan: tidak ada pihak yang merasa paling berkuasa atau selalu mengatur.",
        "Saling menghormati batasan: teman menghargai privasi, waktu istirahat, dan keputusanmu.",
        "Saling mendukung hal positif: mendorong untuk belajar, berkembang, dan berani berbuat baik.",
      ],
      examples: [
        {
          situation: "Teman berbeda pilihan ekstrakurikuler atau hobi.",
          response:
            "\"Keren kamu ikut basket! Aku lebih cocok di klub karya ilmiah, nanti kita saling cerita pengalaman masing-masing ya.\"",
        },
        {
          situation: "Teman sedang kelelahan dan ingin pulang lebih dulu.",
          response:
            "\"Oke, istirahat dulu di rumah ya. Besok kalau sudah enakan baru kita bahas tugas kelompok.\"",
        },
      ],
    },
    {
      categorySlug: "pertemanan-sehat",
      slug: "ciri-dan-praktik-saling-mendukung",
      title: "Ciri Saling Menghargai dan Mendukung dalam Pertemanan",
      summary:
        "Membedakan dukungan tulus dengan tekanan teman sebaya, serta kebiasaan kecil yang menguatkan pertemanan.",
      readingMinutes: 4,
      sortOrder: 2,
      content: `Pertemanan yang bertumbuh terlihat dari kebiasaan sehari-hari di kelas, kantin, maupun saat berkomunikasi lewat pesan singkat. Saling mendukung bukan berarti menutupi kesalahan teman, melainkan membantu teman memilih langkah yang aman dan bertanggung jawab.

Saat teman berhasil meraih sesuatu, teman yang sehat ikut merasa senang tanpa meremehkan. Saat teman mengalami kesulitan, dukungan bisa hadir dalam bentuk mendengarkan cerita dengan tenang, menemani ke guru apabila butuh bantuan, atau memberi semangat yang realistis.`,
      keyPoints: [
        "Menjaga rahasia ringan yang tidak membahayakan keselamatan siapa pun.",
        "Mengakui kesalahan dan meminta maaf dengan tulus ketika keliru.",
        "Mengajak teman pada kebiasaan baik, bukan memaksa melanggar aturan.",
        "Tetap menghormati pilihan teman saat ia berkata \"tidak\" atau belum siap.",
      ],
      examples: [
        {
          situation: "Teman gugup sebelum presentasi di depan kelas.",
          response:
            "\"Wajar kok agak deg-degan, kamu sudah latihan tadi. Aku duduk di baris depan sambil dukung kamu.\"",
        },
      ],
    },
    {
      categorySlug: "relasi-tidak-sehat",
      slug: "mengenali-perilaku-tidak-sehat-dalam-pertemanan",
      title: "Mengenali Relasi Pertemanan yang Tidak Sehat",
      summary:
        "Waspadai tanda-tanda mengejek, mengontrol berlebihan, mengucilkan, memaksa, dan mengancam sejak dini.",
      readingMinutes: 6,
      sortOrder: 1,
      content: `Kadang perilaku yang menyakitkan dibungkus seolah-olah hanya "bercanda" atau "tanda akrab". Padahal, jika suatu candaan atau perlakuan terus membuatmu merasa kecil, takut, cemas, atau tertekan, itu adalah tanda relasi tidak sehat yang perlu diperhatikan.

Beberapa perilaku tidak sehat dalam pergaulan SMP antara lain:
1. Mengejek terus-menerus: menghina fisik, nama orang tua, kemampuan, atau logat bicara meski kamu sudah menunjukkan rasa tidak nyaman.
2. Mengontrol secara berlebihan: melarangmu berteman dengan orang lain, memeriksa ponsel tanpa izin, atau marah jika kamu tidak menuruti kemauannya.
3. Mengucilkan: sengaja tidak mengajak, membungkam saat kamu berbicara, atau membuat grup terpisah untuk menyingkirkan seseorang.
4. Memaksa dan mengancam: menyuruh melakukan hal yang melanggar aturan atau menyakiti orang lain dengan ancaman dijauhi atau disebarkan aibnya.`,
      keyPoints: [
        "Bercanda yang sehat membuat semua pihak tertawa, bukan satu orang menanggung malu.",
        "Kamu berhak menolak ajakan yang melanggar aturan atau membuatmu tidak nyaman.",
        "Perasaan tidak aman dan takut kehilangan teman adalah sinyal penting untuk mencari perspektif orang dewasa tepercaya.",
      ],
      examples: [
        {
          situation: "Seseorang berkata, \"Kalau kamu tidak mau ikut bolos atau menyontek, kamu bukan teman kami lagi.\"",
          response:
            "Ini adalah bentuk pemaksaan dan kontrol tidak sehat. Pertemanan sehat tidak pernah mensyaratkan pelanggaran aturan.",
        },
      ],
    },
    {
      categorySlug: "relasi-tidak-sehat",
      slug: "memahami-perundungan-dan-dampaknya",
      title: "Memahami Perundungan (Bullying) dan Batas Aman",
      summary:
        "Mengenali bentuk perundungan verbal, sosial, fisik, dan digital serta menyadari bahwa korban tidak pernah bersalah.",
      readingMinutes: 5,
      sortOrder: 2,
      content: `Perundungan atau bullying adalah perilaku menyakiti yang dilakukan secara sengaja, berulang, dan melibatkan ketimpangan kuasa (misalnya dilakukan beramai-ramai atau oleh pihak yang merasa lebih kuat).

Perundungan tidak hanya berupa dorongan atau pukulan fisik. Di lingkungan SMP, perundungan juga sering terjadi secara verbal (julukan buruk, hinaan), secara sosial (menyebarkan gosip, sengaja mengucilkan), maupun secara digital/siber (mengunggah foto tanpa izin untuk bahan tertawaan, komentar jahat di media sosial atau grup chat).

Jika kamu melihat atau mengalami perundungan, ingat bahwa kamu tidak harus menanggungnya sendirian. Mencatat bukti kejadian dan melapor kepada Guru BK, wali kelas, atau orang tua adalah langkah perlindungan diri, bukan tindakan "mengadu" yang memalukan.`,
      keyPoints: [
        "Perundungan bisa berbentuk fisik, verbal, relasional/sosial, maupun digital.",
        "Diam atau membalas dengan kekerasan justru berisiko memperpanjang masalah.",
        "Menjadi saksi yang peduli (upstander) bisa dimulai dengan tidak ikut menertawakan dan menemani teman yang disakiti.",
      ],
      examples: [
        {
          situation: "Ada foto teman yang diedit menjadi bahan ejekan di grup pesan.",
          response:
            "Jangan ikut meneruskan atau tertawa. Sampaikan bahwa hal itu tidak pantas, simpan tangkapan layar bila perlu sebagai bukti, dan laporkan ke orang dewasa tepercaya.",
        },
      ],
    },
    {
      categorySlug: "komunikasi-interpersonal",
      slug: "seni-mendengarkan-secara-aktif",
      title: "Mendengarkan Secara Aktif dan Penuh Perhatian",
      summary:
        "Cara membuat teman merasa didengar tanpa langsung memotong pembicaraan atau menghakimi.",
      readingMinutes: 4,
      sortOrder: 1,
      content: `Komunikasi interpersonal bukan hanya soal pandai berbicara, melainkan juga kemauan untuk benar-benar mendengarkan. Banyak kesalahpahaman antarteman muncul karena kita terlalu cepat menyimpulkan atau sibuk menyiapkan balasan sebelum teman selesai bercerita.

Mendengarkan secara aktif berarti memberi perhatian penuh: menaruh ponsel sejenak, menjaga kontak mata yang nyaman, tidak memotong kalimat, dan memastikan kita menangkap maksud serta perasaan teman dengan tepat.`,
      keyPoints: [
        "Berikan perhatian penuh dan hindari mengecek gawai saat teman bercerita hal penting.",
        "Ulangi inti ceritanya secara singkat untuk memastikan pemahaman (parafrase).",
        "Ajukan pertanyaan terbuka yang lembut, bukan pertanyaan yang menyalahkan.",
      ],
      examples: [
        {
          situation: "Teman terlihat murung karena nilainya turun.",
          response:
            "\"Kedengarannya kamu kecewa banget sama hasil ulangan tadi ya. Bagian mana yang paling bikin kamu kesal?\"",
        },
      ],
    },
    {
      categorySlug: "komunikasi-interpersonal",
      slug: "menyampaikan-pendapat-dan-menghargai-perbedaan",
      title: "Menyampaikan Pendapat dan Menghargai Perbedaan",
      summary:
        "Menjaga diskusi kelompok tetap nyaman meski punya ide yang berbeda.",
      readingMinutes: 4,
      sortOrder: 2,
      content: `Saat kerja kelompok atau berdiskusi, wajar jika setiap siswa punya ide berbeda. Komunikasi yang sehat memisahkan antara "mengkritisi ide" dan "menyerang pribadi".

Daripada berkata "Idemu jelek banget sih", kita bisa menyampaikan pertimbangan dengan sopan dan membuka ruang bagi ide lain. Menghargai perbedaan latar belakang, sifat pendiam maupun aktif, serta gaya belajar membuat lingkungan kelas terasa aman bagi semua orang.`,
      keyPoints: [
        "Fokus pada topik atau ide, bukan menyerang sifat pribadi teman.",
        "Gunakan nada suara yang tenang dan kata-kata yang menghormati.",
        "Beri kesempatan berbicara kepada teman yang lebih pendiam di kelompok.",
      ],
      examples: [
        {
          situation: "Tidak setuju dengan pembagian tugas kelompok.",
          response:
            "\"Ide poster kamu bagus. Gimana kalau bagian materinya dibagi berdua supaya kita bisa selesai tepat waktu?\"",
        },
      ],
    },
    {
      categorySlug: "komunikasi-asertif",
      slug: "apa-itu-komunikasi-asertif",
      title: "Mengenal Komunikasi Asertif",
      summary:
        "Memahami perbedaan sikap pasif, agresif, dan asertif agar berani berkata jujur tanpa menyakiti.",
      readingMinutes: 5,
      sortOrder: 1,
      content: `Dalam pergaulan sehari-hari, ada tiga gaya komunikasi yang sering muncul:
1. Pasif: memendam perasaan dan selalu mengiyakan meski sebenarnya tidak nyaman atau dirugikan.
2. Agresif: menyampaikan keinginan dengan membentak, menyalahkan, atau merendahkan orang lain.
3. Asertif: menyampaikan perasaan, kebutuhan, dan batasan secara jujur, jelas, dan tetap menghormati diri sendiri maupun lawan bicara.

Komunikasi asertif membantu siswa SMP menolak ajakan yang tidak sesuai, meminta bantuan ketika kewalahan, atau menegur candaan yang melewati batas tanpa harus bertengkar.`,
      keyPoints: [
        "Asertif berbeda dari agresif: asertif tegas pada batasan, tetapi lembut pada martabat orang lain.",
        "Kamu berhak berkata \"tidak\" dengan sopan tanpa perlu merasa bersalah.",
        "Gunakan bahasa tubuh yang tenang: berdiri/duduk tegap, suara jelas, dan ekspresi wajar.",
      ],
      examples: [
        {
          situation: "Teman terus meminjam catatanmu tepat sebelum ujian hingga kamu tidak sempat belajar.",
          response:
            "\"Aku senang bisa bantu, tapi hari ini aku masih perlu pakai catatanku untuk belajar. Setelah bel pulang nanti baru boleh kamu foto ya.\"",
        },
      ],
    },
    {
      categorySlug: "komunikasi-asertif",
      slug: "rumus-kalimat-aku-merasa-ketika",
      title: "Langkah Sederhana: Kalimat \"Aku Merasa... Ketika...\"",
      summary:
        "Latihan praktis menyusun kalimat I-Statement agar lawan bicara tidak langsung defensif.",
      readingMinutes: 5,
      sortOrder: 2,
      content: `Ketika merasa kesal, kita sering memulai kalimat dengan kata "Kamu selalu..." atau "Kamu tuh...". Kalimat seperti itu sering membuat teman merasa diserang sehingga membalas dengan marah.

Salah satu teknik komunikasi asertif yang mudah dipraktikkan adalah pola I-Statement:
- Aku merasa [sebutkan perasaanmu, misal: sedih / tidak nyaman / kewalahan]
- Ketika [sebutkan perilaku spesifik tanpa menghakimi]
- Karena [jelaskan dampaknya bagimu]
- Aku berharap [sampaikan permintaan yang jelas dan realistis].

Dengan pola ini, kamu tetap jujur tentang perasaanmu sambil membuka pintu penyelesaian yang baik.`,
      keyPoints: [
        "Mulai dari perasaanmu sendiri (\"Aku merasa...\"), bukan tuduhan (\"Kamu jahat...\").",
        "Jelaskan kejadian spesifik secara singkat, bukan mengungkit kesalahan masa lalu.",
        "Tutup dengan harapan atau solusi konkret yang bisa dilakukan bersama.",
      ],
      examples: [
        {
          situation: "Teman sering memanggil dengan julukan fisik di depan kelas.",
          response:
            "\"Aku merasa nggak nyaman ketika dipanggil dengan julukan itu di depan kelas, karena bikin aku malu. Aku harap kamu panggil namaku saja seperti biasa ya.\"",
        },
      ],
    },
    {
      categorySlug: "belajar-empati",
      slug: "memahami-perasaan-teman-dengan-empati",
      title: "Memahami Perasaan Teman: Apa Itu Empati?",
      summary:
        "Membedakan empati dengan simpati, dan bagaimana mencoba melihat situasi dari sudut pandang teman.",
      readingMinutes: 4,
      sortOrder: 1,
      content: `Empati adalah kemampuan untuk mencoba memahami apa yang sedang dirasakan dan dipikirkan orang lain dari sudut pandangnya. Berbeda dengan sekadar merasa kasihan, empati mendorong kita untuk hadir secara tulus dan tidak menganggap remeh masalah orang lain.

Di lingkungan SMP, setiap siswa membawa cerita dan tantangan yang berbeda—ada yang sedang menyesuaikan diri sebagai siswa baru, ada yang gugup tampil, ada pula yang sedang sedih karena masalah keluarga. Melatih empati membuat sekolah menjadi tempat yang lebih ramah.`,
      keyPoints: [
        "Empati bukan berarti harus langsung menyelesaikan semua masalah teman.",
        "Hindari kalimat yang mengecilkan perasaan seperti \"Ah gitu doang lebay\".",
        "Tanyakan apa yang sedang dibutuhkan teman: hanya didengar atau dibantu sesuatu.",
      ],
      examples: [
        {
          situation: "Teman tampak duduk sendirian di jam istirahat setelah dimarahi karena salah jadwal piket.",
          response:
            "\"Kamu lagi butuh ditemani duduk sebentar? Pasti nggak enak rasanya tadi kena tegur di depan banyak orang.\"",
        },
      ],
    },
    {
      categorySlug: "belajar-empati",
      slug: "memberi-dukungan-yang-aman-dan-tepat",
      title: "Memberi Dukungan Tanpa Menghakimi",
      summary:
        "Kalimat penguat yang tepat dan kapan harus mengajak teman berbicara ke orang dewasa.",
      readingMinutes: 4,
      sortOrder: 2,
      content: `Memberikan dukungan yang baik dimulai dengan kehadiran yang tenang. Kalimat sederhana seperti "Terima kasih sudah cerita ke aku" atau "Aku dengerin kok" sering kali jauh lebih menenangkan daripada langsung memberi ceramah panjang.

Namun penting diingat: empati juga berarti tahu batas kemampuan diri. Jika teman bercerita tentang ancaman keselamatan, kekerasan, perundungan berat, atau keinginan menyakiti diri, dukungan terbaik adalah menemani dan segera menghubungkannya dengan Guru BK, wali kelas, atau orang tua.`,
      keyPoints: [
        "Validasi perasaan teman sebelum memberi saran (jika ia memang meminta saran).",
        "Jangan memaksa teman bercerita kalau ia belum siap.",
        "Jika menyangkut bahaya atau keselamatan, segera libatkan Guru BK atau orang dewasa tepercaya.",
      ],
      examples: [
        {
          situation: "Teman bercerita dirinya sering diancam sepulang sekolah.",
          response:
            "\"Terima kasih sudah berani cerita. Masalah ancaman ini nggak bisa ditanggung sendiri, ayo aku temani bicara ke Guru BK atau orang tuamu supaya kamu aman.\"",
        },
      ],
    },
    {
      categorySlug: "menghadapi-konflik",
      slug: "langkah-tenang-saat-konflik-terjadi",
      title: "Menenangkan Diri Sebelum Menyelesaikan Konflik",
      summary:
        "Teknik jeda sejenak agar emosi tidak meledak dan konflik tidak berubah menjadi permusuhan.",
      readingMinutes: 5,
      sortOrder: 1,
      content: `Konflik atau salah paham dengan teman adalah hal yang sangat wajar terjadi. Masalah biasanya membesar bukan karena konfliknya sendiri, melainkan karena kedua pihak berbicara saat emosi masih memuncak.

Langkah pertama menghadapi konflik secara aman adalah mengambil jeda:
1. Sadari tanda tubuh saat marah (jantung berdebar, suara meninggi, tangan mengepal).
2. Tarik napas perlahan atau minta waktu jeda sejenak: "Aku butuh waktu 10 menit untuk tenang dulu, nanti kita bahas lagi."
3. Hindari menulis pesan bernada kasar di grup chat saat sedang emosi, karena jejak digital mudah memperkeruh suasana.`,
      keyPoints: [
        "Mengambil jeda bukan berarti kalah atau lari, melainkan menjaga agar tidak menyesal karena ucapan kasar.",
        "Selesaikan salah paham di ruang yang tenang, bukan dengan saling sindir di media sosial.",
        "Jika situasi terasa mengarah pada kekerasan fisik, segera menjauh ke tempat aman dan cari guru atau petugas sekolah.",
      ],
      examples: [
        {
          situation: "Debat panas dengan teman di pesan singkat.",
          response:
            "\"Kayaknya kita sama-sama lagi emosi nih. Aku istirahat sebentar dulu ya, besok di sekolah kita obrolin baik-baik.\"",
        },
      ],
    },
    {
      categorySlug: "menghadapi-konflik",
      slug: "mencari-kesepakatan-secara-aman",
      title: "Mendengarkan dan Mencari Kesepakatan Bersama",
      summary:
        "Empat tahap sederhana menyelesaikan masalah antarteman menuju solusi yang adil.",
      readingMinutes: 5,
      sortOrder: 2,
      content: `Setelah kedua pihak cukup tenang, saatnya mencari titik temu yang aman dan adil:
1. Sampaikan sudut pandang masing-masing bergantian tanpa saling memotong (gunakan kalimat "Aku merasa...").
2. Dengarkan penjelasan teman untuk melihat apakah ada kesalahpahaman yang tidak disengaja.
3. Cari kesepakatan bersama yang bisa dijalankan kedua pihak (win-win solution).
4. Bila konflik berulang, buntu, atau melibatkan ancaman/perundungan, libatkan pihak ketiga yang netral seperti Guru BK atau wali kelas sebagai penengah.`,
      keyPoints: [
        "Tujuannya adalah memperbaiki keamanan hubungan atau aturan main, bukan mencari siapa yang paling hebat.",
        "Boleh sepakat untuk menjaga jarak sehat apabila memang belum nyaman akrab kembali.",
        "Libatkan Guru BK atau wali kelas jika konflik tidak terselesaikan atau menyangkut rasa aman.",
      ],
      examples: [
        {
          situation: "Salah paham karena rumor yang beredar di kelas.",
          response:
            "\"Aku dengar kabar itu kemarin dan sempat kesal. Bisa cerita dari versi kamu dulu nggak biar nggak salah paham?\"",
        },
      ],
    },
  ];

  for (const m of materialsData) {
    const categoryId = categoryMap[m.categorySlug];
    await prisma.material.upsert({
      where: { slug: m.slug },
      update: {
        categoryId,
        title: m.title,
        summary: m.summary,
        content: m.content,
        keyPointsJson: JSON.stringify(m.keyPoints),
        examplesJson: JSON.stringify(m.examples),
        readingMinutes: m.readingMinutes,
        sortOrder: m.sortOrder,
        isPublished: true,
      },
      create: {
        categoryId,
        slug: m.slug,
        title: m.title,
        summary: m.summary,
        content: m.content,
        keyPointsJson: JSON.stringify(m.keyPoints),
        examplesJson: JSON.stringify(m.examples),
        readingMinutes: m.readingMinutes,
        sortOrder: m.sortOrder,
        isPublished: true,
        createdById: adminUser.id,
      },
    });
  }

  // 5. Seed Quizzes & Scenarios
  const quizzesSeed = [
    {
      slug: "kuis-pertemanan-sehat-dan-batasan",
      categorySlug: "pertemanan-sehat",
      title: "Kuis Edukatif: Pertemanan Sehat & Batasan Aman",
      description:
        "Latihan reflektif untuk membedakan ciri pertemanan yang saling menghargai dengan tanda-tanda relasi tidak sehat.",
      type: "QUIZ" as const,
      sortOrder: 1,
      questions: [
        {
          prompt:
            "Manakah situasi yang paling menunjukkan ciri pertemanan yang sehat?",
          scenarioContext: null,
          sortOrder: 1,
          options: [
            {
              label: "A",
              optionText:
                "Teman menghargai keputusanmu saat kamu tidak ikut pergi karena harus mengerjakan tugas di rumah.",
              isRecommended: true,
              feedbackText:
                "Tepat! Dalam pertemanan sehat, batasan waktu, prioritas, dan hak untuk berkata tidak tetap dihormati tanpa ancaman.",
            },
            {
              label: "B",
              optionText:
                "Teman marah dan mengancam akan menjauhimu jika kamu berteman dengan siswa kelas lain.",
              isRecommended: false,
              feedbackText:
                "Membatasi siapa yang boleh menjadi temanmu adalah tanda perilaku mengontrol yang tidak sehat.",
            },
            {
              label: "C",
              optionText:
                "Teman sering menertawakan penampilanmu di depan umum lalu berkata bahwa itu cuma bercanda.",
              isRecommended: false,
              feedbackText:
                "Candaan yang membuat seseorang merasa malu atau tertekan berulang kali bukan bagian dari pertemanan sehat.",
            },
          ],
        },
        {
          prompt:
            "Jika temanmu menyuruhmu melakukan sesuatu yang melanggar aturan sekolah dengan alasan \"solidaritas\", sikap paling aman adalah...",
          scenarioContext: null,
          sortOrder: 2,
          options: [
            {
              label: "A",
              optionText:
                "Menolak dengan tegas namun sopan, karena pertemanan sejati tidak memaksa melakukan hal berisiko.",
              isRecommended: true,
              feedbackText:
                "Benar sekali! Solidaritas yang sehat selalu menjaga keselamatan dan tanggung jawab bersama.",
            },
            {
              label: "B",
              optionText:
                "Menuruti saja walaupun takut, supaya tetap dianggap bagian dari kelompok.",
              isRecommended: false,
              feedbackText:
                "Mengikuti tekanan yang melanggar aturan dapat merugikan dirimu dan membuat pola pemaksaan terus berulang.",
            },
            {
              label: "C",
              optionText:
                "Membalas memaksa teman lain agar ikut melanggar aturan.",
              isRecommended: false,
              feedbackText:
                "Mengajak orang lain melanggar aturan justru memperluas masalah.",
            },
          ],
        },
        {
          prompt:
            "Mengapa penting memahami perbedaan bercanda dengan perundungan verbal?",
          scenarioContext: null,
          sortOrder: 3,
          options: [
            {
              label: "A",
              optionText:
                "Agar kita peka terhadap batas nyaman diri sendiri maupun teman, dan bisa berhenti jika ada yang terluka.",
              isRecommended: true,
              feedbackText:
                "Tepat! Kepekaan terhadap rasa aman orang lain membantu menjaga suasana pergaulan tetap menyenangkan.",
            },
            {
              label: "B",
              optionText:
                "Supaya tidak perlu lagi bercanda dengan siapa pun di sekolah.",
              isRecommended: false,
              feedbackText:
                "Bercanda tetap boleh dan sehat selama tidak merendahkan, mengejek fisik, atau menyakiti.",
            },
            {
              label: "C",
              optionText:
                "Agar bisa membalas ejekan dengan kalimat yang lebih tajam.",
              isRecommended: false,
              feedbackText:
                "Membalas ejekan justru memicu konflik yang lebih besar.",
            },
          ],
        },
      ],
    },
    {
      slug: "kuis-komunikasi-asertif-dan-empati",
      categorySlug: "komunikasi-asertif",
      title: "Kuis Edukatif: Komunikasi Asertif & Empati",
      description:
        "Uji pemahamanmu tentang cara mendengarkan secara aktif, berempati, dan menyusun kalimat asertif.",
      type: "QUIZ" as const,
      sortOrder: 2,
      questions: [
        {
          prompt:
            "Kalimat manakah yang menerapkan pola komunikasi asertif \"Aku merasa... ketika...\" dengan tepat?",
          scenarioContext: null,
          sortOrder: 1,
          options: [
            {
              label: "A",
              optionText:
                "\"Aku merasa sedih dan bingung ketika pendapatku dipotong saat diskusi, karena aku juga ingin idenya didengar.\"",
              isRecommended: true,
              feedbackText:
                "Bagus! Kalimat ini fokus pada perasaan dan kejadian spesifik tanpa menyerang atau menyalahkan pribadi teman.",
            },
            {
              label: "B",
              optionText:
                "\"Kamu tuh egois banget sih, nggak pernah mau dengerin orang lain ngomong!\"",
              isRecommended: false,
              feedbackText:
                "Kalimat ini memakai label negatif (agresif) yang membuat lawan bicara mudah tersinggung dan defensif.",
            },
            {
              label: "C",
              optionText:
                "\"Ya sudahlah terserah kamu saja, aku nggak usah ngomong apa-apa lagi.\"",
              isRecommended: false,
              feedbackText:
                "Menahan semua perasaan secara pasif dapat membuatmu memendam kekesalan dan tidak menyelesaikan masalah.",
            },
          ],
        },
        {
          prompt:
            "Saat teman sedang bercerita bahwa ia sedih karena berselisih dengan temannya, respons empatik yang paling membantu adalah...",
          scenarioContext: null,
          sortOrder: 2,
          options: [
            {
              label: "A",
              optionText:
                "\"Pasti berat ya rasanya. Aku di sini siap dengerin kalau kamu mau cerita pelan-pelan.\"",
              isRecommended: true,
              feedbackText:
                "Sangat tepat! Mengakui perasaan teman dan hadir mendengarkan tanpa menghakimi adalah bentuk empati nyata.",
            },
            {
              label: "B",
              optionText:
                "\"Ah masalah gitu doang dipikirin, santai aja kali!\"",
              isRecommended: false,
              feedbackText:
                "Kalimat ini mengecilkan perasaan teman sehingga ia bisa merasa tidak dimengerti.",
            },
            {
              label: "C",
              optionText:
                "Langsung menyebarkan cerita itu ke teman-teman lain di kelas.",
              isRecommended: false,
              feedbackText:
                "Menyebarkan curhatan teman tanpa izin dapat melanggar kepercayaan dan memperkeruh situasi.",
            },
          ],
        },
        {
          prompt:
            "Apa langkah pertama yang aman saat emosi memuncak ketika berdebat dengan teman?",
          scenarioContext: null,
          sortOrder: 3,
          options: [
            {
              label: "A",
              optionText:
                "Mengambil jeda sejenak untuk menenangkan napas sebelum melanjutkan pembicaraan.",
              isRecommended: true,
              feedbackText:
                "Tepat! Jeda membantu kita berpikir jernih agar ucapan tidak menyakiti atau memperbesar konflik.",
            },
            {
              label: "B",
              optionText:
                "Menulis status sindiran di media sosial agar teman sadar.",
              isRecommended: false,
              feedbackText:
                "Saling sindir di media sosial justru melibatkan banyak pihak dan memperpanjang konflik.",
            },
            {
              label: "C",
              optionText:
                "Berteriak lebih keras supaya pembicaraan cepat selesai.",
              isRecommended: false,
              feedbackText:
                "Nada suara yang tinggi membuat konflik semakin panas dan sulit mencapai kesepakatan.",
            },
          ],
        },
      ],
    },
    {
      slug: "skenario-mengatasi-ejekan-dan-pengucilan",
      categorySlug: "relasi-tidak-sehat",
      title: "Skenario: Saat Teman Mengejek dan Mengucilkan di Grup",
      description:
        "Simulasi situasi pertemanan sehari-hari di sekolah dan ruang obrolan digital untuk melatih respons yang aman dan bijak.",
      type: "SCENARIO" as const,
      sortOrder: 3,
      questions: [
        {
          scenarioContext:
            "Di jam istirahat, kamu melihat salah satu teman sekelasmu sering dijadikan bahan lelucon soal cara bicaranya di grup chat kelas. Beberapa siswa ikut mengirim stiker tertawa, sementara teman tersebut mulai terlihat diam dan menyendiri di bangku belakang.",
          prompt:
            "Sebagai teman sekelas yang menyaksikan kejadian tersebut, tindakan aman apa yang paling konstruktif kamu lakukan?",
          sortOrder: 1,
          options: [
            {
              label: "A",
              optionText:
                "Tidak ikut menertawakan, menghampiri teman tersebut untuk menanyakan kabarnya, dan mengajak bicara Guru BK jika ejekan berulang.",
              isRecommended: true,
              feedbackText:
                "Langkah yang sangat peduli dan aman! Tidak ikut mendukung ejekan, menemani teman agar tidak merasa sendirian, serta melibatkan Guru BK saat berulang adalah tindakan upstander yang bijak.",
            },
            {
              label: "B",
              optionText:
                "Ikut diam saja di grup karena takut nanti gantian diejek.",
              isRecommended: false,
              feedbackText:
                "Wajar jika muncul rasa ragu, namun kamu tetap bisa memberi dukungan secara pribadi kepada teman yang diejek atau melapor secara aman kepada Guru BK/wali kelas.",
            },
            {
              label: "C",
              optionText:
                "Membalas mengejek balik si pelaku di grup chat dengan kata-kata kasar.",
              isRecommended: false,
              feedbackText:
                "Membalas dengan ejekan baru tidak menghentikan perundungan dan justru bisa memicu pertengkaran lebih luas.",
            },
          ],
        },
        {
          scenarioContext:
            "Setelah kejadian itu, beberapa siswa mengajakmu menjauhi teman tersebut dengan alasan supaya kelompok kalian tetap kompak.",
          prompt: "Bagaimana sebaiknya kamu merespons ajakan untuk mengucilkan teman?",
          sortOrder: 2,
          options: [
            {
              label: "A",
              optionText:
                "Menolak ajakan mengucilkan secara tenang: \"Aku tetap mau berteman baik dengan semua orang dan nggak nyaman ikut menjauhi dia.\"",
              isRecommended: true,
              feedbackText:
                "Hebat! Sikap asertif seperti ini menjaga integritasmu dan menunjukkan bahwa kekompakan tidak dibangun dengan menyakiti orang lain.",
            },
            {
              label: "B",
              optionText:
                "Mengikuti ajakan mereka supaya tidak kehilangan teman bermain.",
              isRecommended: false,
              feedbackText:
                "Ikut mengucilkan dapat membuat korban merasa sangat tertekan, dan kelompok yang dibangun di atas pengucilan tidak memberikan rasa aman jangka panjang.",
            },
          ],
        },
      ],
    },
    {
      slug: "skenario-komunikasi-asertif-saat-konflik",
      categorySlug: "menghadapi-konflik",
      title: "Skenario: Tugas Kelompok Tidak Seimbang & Konflik Teman",
      description:
        "Latih cara menyampaikan keberatan secara asertif dan mencari kesepakatan adil tanpa merusak hubungan.",
      type: "SCENARIO" as const,
      sortOrder: 4,
      questions: [
        {
          scenarioContext:
            "Kamu satu kelompok dengan teman akrabmu untuk tugas presentasi besok. Sampai sore ini, bagian materinya belum dikerjakan sementara ia terus mengajakmu bermain gim terlebih dahulu.",
          prompt:
            "Bagaimana cara menyampaikan pesan yang paling asertif dan efektif?",
          sortOrder: 1,
          options: [
            {
              label: "A",
              optionText:
                "\"Aku merasa khawatir kalau tugas kita belum siap untuk besok. Aku pengin kita selesaikan bagian masing-masing malam ini dulu, baru nanti main bareng.\"",
              isRecommended: true,
              feedbackText:
                "Tepat! Kamu menyampaikan perasaan, alasan yang jelas, dan solusi nyata tanpa memarahi atau memendam kesal sendirian.",
            },
            {
              label: "B",
              optionText:
                "Mengerjakan semua bagiannya diam-diam sendiri sampai larut malam sambil kesal.",
              isRecommended: false,
              feedbackText:
                "Mengambil alih semua tugas secara pasif membuatmu kelelahan dan tidak melatih tanggung jawab bersama.",
            },
            {
              label: "C",
              optionText:
                "Mengirim pesan marah: \"Kamu tuh pemalas banget, nyusahin kelompok aja!\"",
              isRecommended: false,
              feedbackText:
                "Menyerang karakter teman sering membuat ia tersinggung sehingga fokus beralih ke pertengkaran, bukan penyelesaian tugas.",
            },
          ],
        },
        {
          scenarioContext:
            "Keesokan harinya di sekolah, temanmu sempat tersinggung karena merasa ditegur. Ia berbicara dengan nada tinggi di koridor.",
          prompt:
            "Apa langkah paling bijak agar konflik tidak membesar?",
          sortOrder: 2,
          options: [
            {
              label: "A",
              optionText:
                "Menjaga suara tetap tenang, mengajak pindah ke tempat yang lebih sepi, mendengarkan alasannya, lalu mencari kesepakatan pembagian peran yang jelas.",
              isRecommended: true,
              feedbackText:
                "Sangat bijak! Menjaga emosi, menghindari keramaian, dan mendengarkan dua arah membantu menemukan kesepakatan yang adil.",
            },
            {
              label: "B",
              optionText:
                "Ikut berteriak di koridor agar siswa lain tahu siapa yang benar.",
              isRecommended: false,
              feedbackText:
                "Berdebat di depan banyak orang memperbesar rasa malu dan membuat penyelesaian masalah jauh lebih sulit.",
            },
          ],
        },
      ],
    },
  ];

  for (const qz of quizzesSeed) {
    const categoryId = qz.categorySlug ? categoryMap[qz.categorySlug] : null;
    const existingQuiz = await prisma.quiz.findUnique({
      where: { slug: qz.slug },
      include: { questions: true },
    });

    if (!existingQuiz) {
      const createdQuiz = await prisma.quiz.create({
        data: {
          slug: qz.slug,
          categoryId,
          title: qz.title,
          description: qz.description,
          type: qz.type,
          sortOrder: qz.sortOrder,
          isPublished: true,
          createdById: adminUser.id,
        },
      });

      for (const question of qz.questions) {
        await prisma.quizQuestion.create({
          data: {
            quizId: createdQuiz.id,
            prompt: question.prompt,
            scenarioContext: question.scenarioContext,
            sortOrder: question.sortOrder,
            options: {
              create: question.options.map((opt, idx) => ({
                label: opt.label,
                optionText: opt.optionText,
                isRecommended: opt.isRecommended,
                feedbackText: opt.feedbackText,
                sortOrder: idx + 1,
              })),
            },
          },
        });
      }
    }
  }

  // 6. Seed Help Resources (No invented real schools/teachers/policies)
  const helpResourcesData = [
    {
      title: "Berbicara dengan Guru Bimbingan dan Konseling (Guru BK) di Sekolah",
      audienceScope: "SCHOOL" as const,
      summary:
        "Guru BK adalah pendidik di sekolah yang siap mendengarkan, mendampingi, dan membantu mencarikan solusi aman ketika kamu menghadapi masalah pertemanan atau perundungan.",
      whenToReachOut:
        "Hubungi Guru BK jika kamu terus-menerus diejek, dikucilkan, dipaksa melakukan sesuatu, diancam, atau merasa tidak aman berada di kelas/lingkungan sekolah.",
      steps: [
        "Datangi ruang BK pada jam istirahat atau buat janji singkat setelah jam pelajaran.",
        "Ceritakan kejadian secara jujur: apa yang terjadi, kapan, siapa saja yang terlibat, dan bagaimana perasaanmu.",
        "Jika ada bukti pesan atau tangkapan layar perundungan digital, tunjukkan kepada Guru BK.",
        "Diskusikan langkah perlindungan diri yang nyaman dan aman bersama Guru BK.",
      ],
      contactRole: "Guru Bimbingan dan Konseling (BK) Sekolah",
      sortOrder: 1,
    },
    {
      title: "Menghubungi Wali Kelas atau Guru Tepercaya",
      audienceScope: "SCHOOL" as const,
      summary:
        "Wali kelas dan guru mata pelajaran yang kamu percaya dapat membantu menjembatani masalah di kelas dengan cepat.",
      whenToReachOut:
        "Ketika terjadi konflik kerja kelompok yang tidak kunjung selesai, gangguan di dalam kelas, atau ketika kamu membutuhkan bantuan segera saat jam sekolah berlangsung.",
      steps: [
        "Temui wali kelas sebelum atau sesudah pelajaran, atau sampaikan ingin berbicara secara pribadi.",
        "Jelaskan situasi secara tenang tanpa perlu melebih-lebihkan.",
        "Minta bantuan wali kelas untuk menengahi atau berkoordinasi dengan Guru BK bila diperlukan.",
      ],
      contactRole: "Wali Kelas / Guru Sekolah",
      sortOrder: 2,
    },
    {
      title: "Bercerita kepada Orang Tua, Wali, atau Keluarga Dewasa di Rumah",
      audienceScope: "HOME" as const,
      summary:
        "Orang tua, wali, atau anggota keluarga dewasa yang tepercaya merupakan pendamping utama untuk menjaga keselamatan dan ketenanganmu di luar sekolah.",
      whenToReachOut:
        "Segera bercerita ke orang tua/wali apabila kamu merasa takut berangkat sekolah, mengalami ancaman fisik maupun pesan digital yang mengintimidasi, atau merasa terbebani berkepanjangan.",
      steps: [
        "Pilih waktu yang tenang di rumah, lalu katakan bahwa kamu butuh didengarkan tanpa langsung dihakimi.",
        "Ceritakan kondisi yang kamu alami di sekolah atau media sosial.",
        "Ajak orang tua atau wali bekerja sama dengan pihak sekolah (Guru BK atau wali kelas) bila situasi menyangkut keamananmu.",
      ],
      contactRole: "Orang Tua / Wali / Keluarga Dewasa Tepercaya",
      sortOrder: 3,
    },
    {
      title: "Langkah Cepat Saat Mengalami Pengucilan, Ancaman, atau Perundungan",
      audienceScope: "SAFETY_STEPS" as const,
      summary:
        "Panduan praktis menjaga keselamatan diri saat menghadapi situasi tidak aman, baik secara langsung maupun melalui media digital.",
      whenToReachOut:
        "Gunakan langkah ini kapan saja kamu atau temanmu menghadapi ancaman, pemerasan, kekerasan, atau perundungan berulang.",
      steps: [
        "Utamakan keselamatan: segera menjauh menuju tempat ramai atau ruang guru/pos keamanan sekolah jika terancam secara fisik.",
        "Simpan bukti: untuk perundungan digital, ambil tangkapan layar pesan atau komentar tanpa membalas dengan kata kasar.",
        "Jangan simpan sendiri: ceritakan kepada Guru BK, wali kelas, atau orang tua/wali sesegera mungkin.",
        "Catatan penting: TEMANSPACE.ID adalah media edukasi, bukan alat diagnosis psikologis maupun pengganti Guru BK. Aplikasi ini tidak menjanjikan kerahasiaan mutlak apabila keselamatanmu atau orang lain terancam—guru BK dan orang dewasa tepercaya perlu dilibatkan untuk melindungimu.",
      ],
      contactRole: "Guru BK, Wali Kelas, dan Orang Tua / Wali",
      sortOrder: 4,
    },
  ];

  const existingHelpCount = await prisma.helpResource.count();
  if (existingHelpCount === 0) {
    await prisma.helpResource.createMany({
      data: helpResourcesData.map((item) => ({
        title: item.title,
        audienceScope: item.audienceScope,
        summary: item.summary,
        whenToReachOut: item.whenToReachOut,
        stepsJson: JSON.stringify(item.steps),
        contactRole: item.contactRole,
        sortOrder: item.sortOrder,
        isPublished: true,
      })),
    });
  }

  console.log("Seed TEMANSPACE.ID selesai dengan sukses.");
}

main()
  .catch((err) => {
    console.error("Gagal menjalankan seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
