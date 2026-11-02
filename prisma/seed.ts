import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ago = (days: number, hours = 0) =>
  new Date(Date.now() - days * 86400000 - hours * 3600000);
const ahead = (days: number, hours = 0) =>
  new Date(Date.now() + days * 86400000 + hours * 3600000);

async function main() {
  console.log("🌱 Seeding D.Safara database...");

  // ---- wipe ----
  const tables = [
    "auditLog", "certificate", "jobApplication", "jobPosting", "freeResource", "faq",
    "testimonial", "blogPost", "notification", "message", "ticketMessage", "ticket",
    "commission", "coupon", "financialTransaction", "wallet", "orderItem", "order",
    "product", "weeklyReport", "mentorSession", "mentoringPlanEnrollment", "mentoringPlan",
    "tradingReviewComment", "tradingExercise", "tradeJournalEntry", "examAttempt",
    "question", "exam", "submission", "assignment", "lessonProgress", "enrollment",
    "pathCourse", "learningPath", "lesson", "chapter", "course", "category", "otpCode",
    "setting", "user",
  ];
  for (const t of tables) {
    await db.$executeRawUnsafe(`DELETE FROM "${t}";`);
  }

  // ---- users ----
  const admin = await db.user.create({
    data: {
      phone: "09120000000", name: "مدیر دی‌صفارا", email: "admin@dsafara.com",
      role: "ADMIN", bio: "بنیان‌گذار و مدیر پلتفرم دی‌صفارا",
      avatar: "https://i.pravatar.cc/150?u=admin",
      wallet: { create: { balance: 0 } },
    },
  });

  const mentorUser = await db.user.create({
    data: {
      phone: "09121111111", name: "امیرحسین رضایی", email: "mentor@dsafara.com",
      role: "MENTOR", bio: "تحلیلگر ارشد بازارهای مالی با ۱۲ سال سابقه معامله‌گری در فارکس و کریپتو. متخصص پرایس اکشن و اسمارت مانی کانسپت.",
      avatar: "https://i.pravatar.cc/150?u=mentor1",
      wallet: { create: { balance: 184500000 } },
    },
  });

  const mentor2 = await db.user.create({
    data: {
      phone: "09122222222", name: "سارا محمدی", email: "sara@dsafara.com",
      role: "MENTOR", bio: "معامله‌گر حرفه‌ای طلا و شاخص‌ها، متخصص تحلیل چند زمانی و روانشناسی معامله‌گری.",
      avatar: "https://i.pravatar.cc/150?u=mentor2",
      wallet: { create: { balance: 96200000 } },
    },
  });

  const student = await db.user.create({
    data: {
      phone: "09123333333", name: "علی کریمی", email: "student@dsafara.com",
      role: "STUDENT", bio: "دانشجوی مسیر حرفه‌ای ترید",
      avatar: "https://i.pravatar.cc/150?u=student1",
      wallet: { create: { balance: 2500000 } },
    },
  });

  const studentsData = [
    ["09124444444", "محمد حسینی"], ["09125555555", "رضا احمدی"], ["09126666666", "نگار صادقی"],
    ["09127777777", "فاطمه موسوی"], ["09128888888", "حسین قاسمی"], ["09129999999", "مریم رضوانی"],
    ["09121010101", "کیان مرادی"], ["09121212122", "الهام نوری"], ["09121414141", "پارسا کاظمی"],
    ["09121616162", "زهرا ابراهیمی"], ["09121818183", "سینا جعفری"], ["09122020204", "شیما توکلی"],
  ];
  const extraStudents = [];
  for (let i = 0; i < studentsData.length; i++) {
    const [phone, name] = studentsData[i];
    extraStudents.push(
      await db.user.create({
        data: {
          phone, name, role: "STUDENT",
          avatar: `https://i.pravatar.cc/150?u=st${i}`,
          createdAt: ago(30 - i * 2),
          wallet: { create: { balance: Math.floor(Math.random() * 3) * 500000 } },
        },
      })
    );
  }

  // ---- categories ----
  const catData = [
    ["تحلیل تکنیکال", "technical", "آموزش جامع تحلیل تکنیکال، پرایس اکشن و اندیکاتورها", "CandlestickChart"],
    ["مدیریت سرمایه", "risk-management", "اصل اسپرد ریسک، سایز پوزیشن و مدیریت سرمایه حرفه‌ای", "ShieldCheck"],
    ["روانشناسی ترید", "psychology", "تسلط بر ذهن، مدیریت احساسات و دیسیپلین معامله‌گری", "Brain"],
    ["بازار فارکس", "forex", "آموزش تخصصی بازار فارکس، جفت‌ارزها و سشن‌های معاملاتی", "Globe"],
    ["کریپتوکارنسی", "crypto", "بیت‌کوین، آلت‌کوین‌ها، دیفای و تحلیل آنچین", "Bitcoin"],
    ["بورس ایران", "bourse", "تحلیل بنیادی و تکنیکال بورس تهران و کدهای حقوقی", "Landmark"],
  ];
  const cats: Record<string, string> = {};
  for (const [title, slug, description, icon] of catData) {
    const c = await db.category.create({ data: { title, slug, description, icon } });
    cats[slug] = c.id;
  }

  // ---- courses ----
  const courseData = [
    {
      title: "دوره جامع پرایس اکشن صفر تا صد", slug: "price-action-full",
      description: "یادگیری کامل پرایس اکشن از مبانی تا ستاپ‌های پیشرفته، بدون نیاز به اندیکاتور",
      longDescription: "در این دوره شما با زبان خام بازار آشنا می‌شوید؛ از ساختار بازار و نواحی عرضه و تقاضا تا ستاپ‌های ورود پرایس اکشن با حد ضرر دقیق. این دوره برای کسانی طراحی شده که می‌خواهند بدون پیچیدگی اندیکاتورها، مستقیماً از حرکت قیمت معامله کنند.",
      cat: "technical", mentor: mentorUser.id, price: 4800000, oldPrice: 6900000,
      level: "INTERMEDIATE", durationHours: 32, rating: 4.9, studentsCount: 1240,
      image: "/images/course-price-action.jpg",
    },
    {
      title: "مدیریت سرمایه و ریسک حرفه‌ای", slug: "risk-management-pro",
      description: "فرمول‌های سایز پوزیشن، R:R و قوانین حفظ سرمایه برای معامله‌گران جدی",
      longDescription: "بزرگ‌ترین دلیل نابودی حساب‌ها، ندانستن مدیریت سرمایه است. در این دوره ریاضیات ریسک، مدل‌های سایز پوزیشن و ساخت پلن معاملاتی شخصی را به‌صورت عملی یاد می‌گیرید.",
      cat: "risk-management", mentor: mentor2.id, price: 2900000, oldPrice: 3900000,
      level: "BEGINNER", durationHours: 18, rating: 4.8, studentsCount: 980,
      image: "/images/course-risk.jpg",
    },
    {
      title: "اسمارت مانی کانسپت (SMC) پیشرفته", slug: "smc-advanced",
      description: "تحلیل نهادهای بزرگ، اردربلاک‌ها، FVG و لیکوییدیتی به سبک حرفه‌ای",
      longDescription: "اسمارت مانی کانسپت پرطرفدارترین متد تحلیل مدرن است. در این دوره اردربلاک، بریکر بلاک، FVG، لیکوییدیتی سوپ و پروب و مدل‌های ورود ICT را مرحله به مرحله تمرین می‌کنید.",
      cat: "technical", mentor: mentorUser.id, price: 6500000, oldPrice: 8900000,
      level: "ADVANCED", durationHours: 45, rating: 4.9, studentsCount: 760,
      image: "/images/course-smc.jpg",
    },
    {
      title: "روانشناسی معامله‌گری و ذهن میلیاردر", slug: "trading-psychology",
      description: "تسلط بر ترس و طمع، ساختن دیسیپلین و عادت‌های معامله‌گری برنده",
      longDescription: "بهترین استراتژی دنیا هم بدون ذهن آماده شکست می‌خورد. این دوره ترکیبی از علم روانشناسی، عادت‌سازی و تمرین‌های عملی برای ساختن ذهنیت معامله‌گر حرفه‌ای است.",
      cat: "psychology", mentor: mentor2.id, price: 1900000, oldPrice: null,
      level: "BEGINNER", durationHours: 12, rating: 4.7, studentsCount: 1520,
      image: "/images/course-psychology.jpg",
    },
    {
      title: "فارکس از صفر؛ شروع مسیر حرفه‌ای", slug: "forex-zero-to-hero",
      description: "آشنایی کامل با بازار فارکس، بروکرها، پلتفرم و اولین معامله",
      longDescription: "اگر تازه می‌خواهید وارد فارکس شوید، این دوره نقطه شروع شماست؛ از باز کردن حساب دمو و آشنایی با متاتریدر تا اجرای اولین معامله با ریسک کنترل‌شده.",
      cat: "forex", mentor: mentorUser.id, price: 0, oldPrice: null,
      level: "BEGINNER", durationHours: 9, rating: 4.8, studentsCount: 3260,
      image: "/images/course-forex.jpg", isFree: true,
    },
    {
      title: "تحلیل آنچین بیت‌کوین و آلت‌کوین‌ها", slug: "onchain-analysis",
      description: "خواندن داده‌های آنچین، شاخص‌های سیکل و شناسایی کف و سقف بازار کریپتو",
      longDescription: "داده‌های آنچین پنجره‌ای شفاف به رفتار نهنگ‌هاست. در این دوره شاخص‌های MVRV، SOPR، جریان صرافی‌ها و مدل‌های سیکلی بیت‌کوین را یاد می‌گیرید.",
      cat: "crypto", mentor: mentor2.id, price: 5200000, oldPrice: 7200000,
      level: "ADVANCED", durationHours: 28, rating: 4.8, studentsCount: 540,
      image: "/images/course-onchain.jpg",
    },
    {
      title: "تحلیل تکنیکال کلاسیک مدرن", slug: "classic-technical",
      description: " حم و مقاومت، خطوط روند، الگوهای قیمتی و اندیکاتورهای کلیدی",
      longDescription: "پایه هر تحلیل‌گری، تکنیکال کلاسیک است. الگوهای هارمونیک، کلاسیک، اندیکاتورهای مومنتوم و ترکیب چند زمانی را با صدها مثال واقعی یاد می‌گیرید.",
      cat: "technical", mentor: mentorUser.id, price: 3500000, oldPrice: 4500000,
      level: "BEGINNER", durationHours: 24, rating: 4.7, studentsCount: 2130,
      image: "/images/course-classic.jpg",
    },
    {
      title: "استراتژی طلا (XAUUSD) و شاخص‌ها", slug: "gold-strategy",
      description: "ستاپ‌های اختصاصی معامله طلا با در نظر گرفتن خبرهای ماکرو",
      longDescription: "طلا پرمتحرک‌ترین بازار برای معامله‌گران روزانه است. در این دوره سشن لندن و نیویورک، تاثیر داده‌های اقتصادی آمریکا و ستاپ‌های اختصاصی XAUUSD را می‌آموزید.",
      cat: "forex", mentor: mentor2.id, price: 4200000, oldPrice: 5600000,
      level: "INTERMEDIATE", durationHours: 21, rating: 4.9, studentsCount: 870,
      image: "/images/course-gold.jpg",
    },
  ];

  const courses: Record<string, string> = {};
  for (const c of courseData) {
    const created = await db.course.create({
      data: {
        title: c.title, slug: c.slug, description: c.description,
        longDescription: c.longDescription, image: c.image,
        level: c.level, price: c.price, oldPrice: c.oldPrice ?? null,
        durationHours: c.durationHours, rating: c.rating, studentsCount: c.studentsCount,
        isFree: !!c.isFree, categoryId: cats[c.cat], mentorId: c.mentor,
        createdAt: ago(60),
      },
    });
    courses[c.slug] = created.id;
  }

  // chapters + lessons for the main course
  const chapterPlan: Record<string, string[][]> = {
    "price-action-full": [
      ["مبانی ساختار بازار", ["زبان خام بازار چیست؟", "شناسایی روند و ساختار سوینگ", "حم و مقاومت داینامیک", "تمرین: رسم ساختار روی ۱۰ چارت"]],
      ["نواحی عرضه و تقاضا", ["منطق پیدایش نواحی", "شناسایی نواحی تازه (Fresh)", "اصلاحیه یا بازگشت؟", "تمرین: مارک‌آپ نواحی"]],
      ["ستاپ‌های ورود", ["ستاپ پین‌بار در نواحی", "ستاپ انگالفینگ", "مدل ورود چند زمانی", "تمرین: بک‌تست ۵۰ معامله"]],
      ["مدیریت معامله", ["حد ضرر علمی", "پارشیال و تریلینگ", "ژورنال‌نویسی حرفه‌ای"]],
    ],
    "forex-zero-to-hero": [
      ["شروع مسیر", ["فارکس چیست و چه کسانی معامله می‌کنند؟", "بروکر معتبر را چطور انتخاب کنیم؟", "نصب و راه‌اندازی متاتریدر ۵"]],
      ["اولین قدم‌ها", ["مفاهیم پیپ، لات و اسپرد", "باز کردن حساب دمو", "اجرای اولین معامله واقعی روی دمو"]],
    ],
  };
  for (const [slug, chapters] of Object.entries(chapterPlan)) {
    for (let ci = 0; ci < chapters.length; ci++) {
      const [chTitle, lessons] = chapters[ci];
      const ch = await db.chapter.create({
        data: { title: chTitle, order: ci, courseId: courses[slug] },
      });
      for (let li = 0; li < lessons.length; li++) {
        await db.lesson.create({
          data: {
            title: lessons[li], order: li, chapterId: ch.id,
            durationMin: 8 + Math.floor(Math.random() * 25),
            isFree: slug === "forex-zero-to-hero" && ci === 0 && li < 2,
            description: "در این درس به‌صورت گام‌به‌گام همراه با مثال‌های واقعی چارت مفهوم را یاد می‌گیرید.",
          },
        });
      }
    }
  }

  // ---- learning paths ----
  const pathData = [
    {
      title: "مسیر صفر تا معامله‌گر حرفه‌ای", slug: "zero-to-pro",
      description: "مسیر کامل برای کسانی که از صفر شروع می‌کنند و می‌خواهند به معامله‌گری منظم و سودده برسند؛ از مبانی تکنیکال تا روانشناسی و مدیریت سرمایه.",
      icon: "Rocket", level: "BEGINNER", color: "#19b887",
      audience: "افرادی که تازه وارد بازارهای مالی شده‌اند",
      objective: "توانایی تحلیل مستقل چارت و اجرای معاملات با ریسک کنترل‌شده",
      courseSlugs: ["forex-zero-to-hero", "classic-technical", "risk-management-pro", "trading-psychology"],
    },
    {
      title: "مسیر تخصصی پرایس اکشن و SMC", slug: "pa-smc-master",
      description: "برای معامله‌گرانی که می‌خواهند تحلیل بدون اندیکاتور و مبتنی بر رفتار نهادهای بزرگ را تخصصی دنبال کنند.",
      icon: "Target", level: "ADVANCED", color: "#38bdf8",
      audience: "معامله‌گران با حداقل ۶ ماه تجربه",
      objective: "تسلط بر ستاپ‌های پرایس اکشن و اسمارت مانی با وین‌ریت بالای ۵۰٪",
      courseSlugs: ["price-action-full", "smc-advanced", "gold-strategy"],
    },
    {
      title: "مسیر کریپتو و تحلیل آنچین", slug: "crypto-onchain",
      description: "مسیر تخصصی بازار کریپتو از مبانی بلاکچین تا تحلیل آنچین و پیدا کردن نقاط چرخش سیکل.",
      icon: "Bitcoin", level: "INTERMEDIATE", color: "#f5b544",
      audience: "علاقه‌مندان به بازار کریپتوکارنسی",
      objective: "تحلیل مستقل بیت‌کوین و آلت‌کوین‌ها با داده‌های آنچین",
      courseSlugs: ["classic-technical", "onchain-analysis", "risk-management-pro"],
    },
  ];
  for (const p of pathData) {
    const path = await db.learningPath.create({
      data: {
        title: p.title, slug: p.slug, description: p.description, icon: p.icon,
        level: p.level, audience: p.audience, objective: p.objective, color: p.color,
      },
    });
    for (let i = 0; i < p.courseSlugs.length; i++) {
      await db.pathCourse.create({
        data: { pathId: path.id, courseId: courses[p.courseSlugs[i]], order: i },
      });
    }
  }

  // ---- enrollments + progress ----
  const allStudents = [student, ...extraStudents];
  const courseIds = Object.values(courses);
  for (let i = 0; i < allStudents.length; i++) {
    const st = allStudents[i];
    const n = 2 + Math.floor(Math.random() * 4);
    const picked = [...courseIds].sort(() => Math.random() - 0.5).slice(0, n);
    for (const cid of picked) {
      await db.enrollment.create({
        data: { userId: st.id, courseId: cid, progress: Math.floor(Math.random() * 100), createdAt: ago(40 - i * 2) },
      });
    }
  }
  // student gets clean enrollments
  await db.enrollment.deleteMany({ where: { userId: student.id } });
  for (const [slug, prog] of [["price-action-full", 68], ["risk-management-pro", 100], ["forex-zero-to-hero", 42], ["classic-technical", 15]]) {
    await db.enrollment.create({ data: { userId: student.id, courseId: courses[slug], progress: prog, createdAt: ago(25) } });
  }

  // ---- assignments ----
  const asg = await db.assignment.create({
    data: {
      courseId: courses["price-action-full"], title: "تمرین شناسایی نواحی عرضه و تقاضا",
      description: "روی ۵ چارت H4 جفت‌ارز EURUSD نواحی تازه عرضه و تقاضا را مارک‌آپ کنید و تصویر آن را همراه توضیح ارسال کنید.",
      dueDate: ahead(5), maxScore: 100,
    },
  });
  await db.submission.create({
    data: {
      assignmentId: asg.id, userId: student.id,
      content: "سلام، ۵ چارت H4 را مارک‌آپ کردم. نواحی روی EURUSD و GBPUSD مشخص شده. یک سوال دارم: در ناحیه دوم چارت سوم، آیا ناحیه چون تعویض نشده هنوز معتبر محسوب می‌شود؟",
      status: "GRADED", score: 88, feedback: "عالی بود علی جان! مارک‌آپ‌ها دقیق است. جواب سوالت: ناحیه تا زمانی که پرایس دوباره آن را تست نکرده تازه محسوب می‌شود. فقط دقت کن در چارت ۴ ناحیه کمی به سقف نزدیک است.",
      createdAt: ago(3), gradedAt: ago(1),
    },
  });
  const asg2 = await db.assignment.create({
    data: {
      courseId: courses["risk-management-pro"], title: "محاسبه سایز پوزیشن در ۱۰ سناریو",
      description: "برای ۱۰ سناریوی داده‌شده با حساب ۵۰۰۰ دلاری و ریسک ۱٪، سایز پوزیشن را محاسبه کنید.",
      dueDate: ahead(9), maxScore: 100,
    },
  });

  // ---- exams ----
  const exam = await db.exam.create({
    data: {
      courseId: courses["price-action-full"], title: "آزمون فصل ۲: نواحی عرضه و تقاضا",
      description: "۱۵ سوال چهارگزینه‌ای از مباحث فصل دوم", durationMin: 20,
    },
  });
  const qData = [
    ["ناحیه عرضه (Supply) در کدام حالت شکل می‌گیرد؟", ["قبل از ریزش شارپ و صعودی", "قبل از ریزش شارپ و نزولی", "بعد از consolidation طولانی", "هیچ‌کدام"], 1],
    ["ناحیه Fresh به چه ناحیه‌ای گفته می‌شود؟", ["ناحیه‌ای که چند بار تست شده", "ناحیه‌ای که هنوز دوباره تست نشده", "ناحیه‌ای که پر شده", "ناحیه‌ای در تایم پایین"], 1],
    ["کدام گزینه نشانه قوت یک ناحیه تقاضاست؟", ["خروج آرام قیمت", "ریزش شارپ و مواج قبل از صعود", "حجم کم معاملات", "نزدیک بودن به خط روند"], 1],
    ["زمان ورود بهتر با ستاپ پین‌بار کدام است؟", ["وسط رنج", "در نواحی کلیدی پس از واکنش", "هرجا پین‌بار دیدیم", "فقط در تایم H1"], 1],
  ];
  for (let i = 0; i < qData.length; i++) {
    const [text, options, answer] = qData[i] as [string, string[], number];
    await db.question.create({ data: { text, options: JSON.stringify(options), answer, score: 25, examId: exam.id } });
  }

  // ---- trading journal ----
  const journalData = [
    ["XAUUSD", "LONG", 2312.5, 2338.2, 0.1, 2304.0, 2355.0, 257, "OB+ف ویب", "ستاپ اردربلاک H1 بعد از سشن لندن عالی اجرا شد", "آرام", 2],
    ["EURUSD", "SHORT", 1.0842, 1.0798, 0.3, 1.0885, 1.0780, 132, "بریکر بلاک", "خبر NFP بود، ریسک کمتر گرفتم", "کمی عجول", 1],
    ["BTCUSDT", "LONG", 61200, 60450, 0.05, 60100, 63500, -375, "ف ویب", "ورود زودهنگام؛ صبر نمیکردم کلوز FVG بخوره", "FOMO", 0],
    ["GBPUSD", "SHORT", 1.2715, 1.2680, 0.2, 1.2755, 1.2650, 70, "پین‌بار نواحیه", null, "متمرکز", 3],
    ["XAUUSD", "SHORT", 2344.0, 2351.5, 0.1, 2350.0, 2320.0, -75, "لیکوییدیتی سوپ", "حد ضرر خورد ولی ستاپ درست بود", "بی‌حوصلگی", 4],
    ["US30", "LONG", 38450, 38690, 0.1, 38380, 38900, 240, "continuation", "پولبک به OB روزانه", "با اعتماد", 5],
    ["EURUSD", "LONG", 1.0810, 1.0838, 0.3, 1.0790, 1.0860, 84, "ف ویب", null, "آرام", 6],
    ["XAUUSD", "LONG", 2308.0, 2329.4, 0.15, 2302.0, 2340.0, 321, "OB+ف ویب", "بهترین اجرای این ماه", "متمرکز", 7],
  ] as const;
  for (const [symbol, dir, entry, exit, lot, sl, tp, pnl, setup, notes, emotion, daysAgo] of journalData) {
    await db.tradeJournalEntry.create({
      data: {
        userId: student.id, symbol, direction: dir, entryPrice: entry, exitPrice: exit,
        lotSize: lot, stopLoss: sl, takeProfit: tp, pnl, pnlPercent: (pnl / 1000) * 100,
        status: pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN", setup, notes, emotion,
        tradeDate: ago(daysAgo), createdAt: ago(daysAgo),
      },
    });
  }
  // journals for other students (for admin stats)
  for (const st of extraStudents.slice(0, 6)) {
    for (let i = 0; i < 3; i++) {
      const pnl = Math.floor(Math.random() * 600) - 250;
      await db.tradeJournalEntry.create({
        data: {
          userId: st.id, symbol: ["XAUUSD", "EURUSD", "BTCUSDT", "GBPUSD"][i % 4],
          direction: Math.random() > 0.5 ? "LONG" : "SHORT",
          entryPrice: 100 + Math.random() * 100, exitPrice: 100 + Math.random() * 100,
          lotSize: 0.1, pnl, pnlPercent: 1, status: pnl > 0 ? "WIN" : "LOSS",
          tradeDate: ago(i * 3 + 1), createdAt: ago(i * 3 + 1),
        },
      });
    }
  }

  // ---- trading exercises ----
  await db.tradingExercise.create({
    data: {
      userId: student.id, symbol: "XAUUSD", timeframe: "1H",
      taskTitle: "مارک‌آپ نواحی کلیدی و سناریوی معاملاتی هفته",
      description: "چارت ۱ ساعته طلا را با نواحی عرضه/تقاضا و مسیر احتمالی مارک‌آپ کنید.",
      analysis: "سناریوی اصلی: پولبک به اردربلاک H4 در ۲۳۱۰ و ادامه صعود. سناریوی دوم: شکست کف و جمع‌آوری لیکوییدیتی.",
      checklist: JSON.stringify(["ساختار بالاتر تایم مشخص شد", "ناحیه کلیدی مارک شد", "نقطه ورود و استاپ تعیین شد", "R:R حداقل ۱:۲"]),
      status: "REVIEWED", mentorScore: 92,
      mentorFeedback: "مارک‌آپ دقیق و منطقی. فقط سناریوی دوم رو هم با حجم‌ها چک کن. آفرین!",
      createdAt: ago(6), reviewedAt: ago(5),
    },
  });
  await db.tradingExercise.create({
    data: {
      userId: student.id, symbol: "EURUSD", timeframe: "4H",
      taskTitle: "تمرین شناسایی بریکر بلاک",
      description: "دو بریکر بلاک معتبر در چارت ۴ ساعته یورودلار پیدا و مارک کنید.",
      analysis: "بریکر صعودی بعد از جمع لیکوییدیتی کف روزانه و بریکر نزولی در سقف هفتگی را مارک کردم.",
      checklist: JSON.stringify(["ساختار بالاتر تایم مشخص شد", "ناحیه کلیدی مارک شد", "نقطه ورود و استاپ تعیین شد"]),
      status: "PENDING", createdAt: ago(1),
    },
  });

  // ---- mentoring ----
  const planData = [
    ["منتورینگ اختصاصی یک‌ماهه", "mentoring-1m", "پلن فشرده یک‌ماهه با ۲ جلسه در هفته، بررسی ژورنال و تمرین‌های معاملاتی و پلن شخصی‌سازی شده.", 8500000, 30, ["۲ جلسه آنلاین در هفته", "بررسی روزانه ژورنال معاملات", "دسترسی مستقیم در تلگرام", "پلن معاملاتی شخصی"], 2],
    ["منتورینگ سه‌ماهه حرفه‌ای", "mentoring-3m", "مسیر کامل تبدیل شدن به معامله‌گر مستقل در ۳ ماه با پشتیبانی کامل و پروژه‌های عملی.", 22000000, 90, ["۲ جلسه آنلاین در هفته", "بررسی هفتگی عملکرد", "بک‌تست هدایت‌شده", "پلن معاملاتی + روانشناسی", "دسترسی VIP به دوره‌ها"], 2],
    ["جلسه رفع اشکال تکی", "mentoring-single", "یک جلسه ۹۰ دقیقه‌ای برای حل مسئله مشخص در تحلیل یا معامله‌گری شما.", 1500000, 1, ["جلسه ۹۰ دقیقه‌ای آنلاین", "ضبط جلسه", "چک‌لیست اقدام"], 1],
  ] as const;
  const plans = [];
  for (const [title, slug, description, price, durationDays, features, spw] of planData) {
    plans.push(await db.mentoringPlan.create({
      data: { title, slug, description, price, durationDays, features: JSON.stringify(features), sessionsPerWeek: spw },
    }));
  }
  await db.mentoringPlanEnrollment.create({
    data: { planId: plans[0].id, mentorId: mentorUser.id, userId: student.id, status: "ACCEPTED", createdAt: ago(20) },
  });

  const sess = await db.mentorSession.create({
    data: {
      title: "جلسه هفتم: بازبینی معاملات هفته", studentId: student.id, mentorId: mentorUser.id,
      startTime: ahead(1, 3), durationMin: 60, status: "SCHEDULED",
      notes: "تمرکز روی مدیریت پارشیال و بهبود ورودهای سشن لندن",
    },
  });
  await db.mentorSession.create({
    data: {
      title: "جلسه ششم: تحلیل چند زمانی", studentId: student.id, mentorId: mentorUser.id,
      startTime: ago(6), durationMin: 75, status: "COMPLETED",
      notes: "پیشرفت خوب در مارک‌آپ نواحی؛ تمرین بک‌تست ۲۰ معامله داده شد",
    },
  });
  await db.mentorSession.create({
    data: {
      title: "جلسه پنجم: روانشناسی و دیسیپلین", studentId: student.id, mentorId: mentor2.id,
      startTime: ago(12), durationMin: 60, status: "COMPLETED", notes: "کار روی FOMO بعد از ضرر",
    },
  });
  await db.mentorSession.create({
    data: {
      title: "جلسه هشتم: بک‌تست استراتژی طلا", studentId: student.id, mentorId: mentorUser.id,
      startTime: ahead(5, 2), durationMin: 90, status: "SCHEDULED",
    },
  });

  await db.weeklyReport.create({
    data: {
      studentId: student.id, mentorId: mentorUser.id, weekLabel: "هفته دوم آذر",
      summary: "علی این هفته ۹ معامله ثبت کرد؛ وین‌ریت ۶۷٪ و پیروی از پلن بسیار بهتر شده. تمرکز هفته بعد: کاهش حجم در روزهای خبری و تکمیل بک‌تست فصل سوم.",
      progress: 72, createdAt: ago(2),
    },
  });

  // ---- products ----
  const prodData = [
    ["اندیکاتور اختصاصی Supply & Demand دی‌صفارا", "sd-indicator", "اندیکاتور تشخیص خودکار نواحی عرضه و تقاضا برای متاتریدر ۵ و تریدینگ‌ویو با آلارم.", 2200000, "INDICATOR"],
    ["کتاب الکترونیکی نقشه راه معامله‌گر", "trader-roadmap-book", "کتاب ۱۸۰ صفحه‌ای شامل مسیر کامل یادگیری، چک‌لیست‌ها و قالب ژورنال.", 480000, "BOOK"],
    ["قالب ژورنال معاملات اکسل + نوتن", "journal-template", "قالب حرفه‌ای ثبت معاملات با داشبورد آماری خودکار برای اکسل و نوتن.", 320000, "DIGITAL"],
    ["پک ۱۲۰ بک‌دراپ چارت واقعی برای تمرین", "backdrop-pack", "۱۲۰ نمونه چارت واقعی بدون نتیجه برای تمرین تحلیل و بک‌تست.", 690000, "DIGITAL"],
  ] as const;
  for (const [title, slug, description, price, type] of prodData) {
    await db.product.create({ data: { title, slug, description, price, type } });
  }

  // ---- orders ----
  const order = await db.order.create({
    data: {
      orderNo: "DS-1042", userId: student.id, totalAmount: 4800000, status: "PAID",
      createdAt: ago(25), paidAt: ago(25), refId: "884213", couponCode: null,
    },
  });
  await db.orderItem.create({ data: { orderId: order.id, courseId: courses["price-action-full"], title: "دوره جامع پرایس اکشن صفر تا صد", price: 4800000 } });
  const order2 = await db.order.create({
    data: { orderNo: "DS-1057", userId: student.id, totalAmount: 2900000, status: "PAID", createdAt: ago(18), paidAt: ago(18), refId: "912840" },
  });
  await db.orderItem.create({ data: { orderId: order2.id, courseId: courses["risk-management-pro"], title: "مدیریت سرمایه و ریسک حرفه‌ای", price: 2900000 } });
  const order3 = await db.order.create({
    data: { orderNo: "DS-1071", userId: student.id, totalAmount: 480000, status: "PENDING", createdAt: ago(1) },
  });
  await db.orderItem.create({ data: { orderId: order3.id, title: "کتاب الکترونیکی نقشه راه معامله‌گر", price: 480000 } });

  // orders from other students (revenue stats)
  for (let i = 0; i < 18; i++) {
    const st = extraStudents[i % extraStudents.length];
    const cid = courseIds[i % courseIds.length];
    const c = courseData.find((x) => courses[x.slug] === cid)!;
    const amt = c.price || 1000000;
    await db.order.create({
      data: {
        orderNo: `DS-${2000 + i}`, userId: st.id, totalAmount: amt,
        status: i % 7 === 0 ? "PENDING" : "PAID",
        createdAt: ago(i * 2 + 1), paidAt: i % 7 === 0 ? null : ago(i * 2 + 1),
        items: { create: { courseId: cid, title: c.title, price: amt } },
      },
    });
  }

  // ---- wallet transactions ----
  await db.financialTransaction.createMany({
    data: [
      { userId: student.id, type: "DEPOSIT", amount: 5000000, description: "شارژ کیف پول درگاه زرین‌پال", createdAt: ago(26) },
      { userId: student.id, type: "PURCHASE", amount: -4800000, description: "خرید دوره جامع پرایس اکشن", createdAt: ago(25) },
      { userId: student.id, type: "PURCHASE", amount: -2900000, description: "خرید دوره مدیریت سرمایه", createdAt: ago(18) },
      { userId: student.id, type: "DEPOSIT", amount: 5200000, description: "شارژ کیف پول", createdAt: ago(17) },
      { userId: mentorUser.id, type: "COMMISSION", amount: 1440000, description: "کمیسیون فروش دوره پرایس اکشن", createdAt: ago(25) },
      { userId: mentorUser.id, type: "WITHDRAWAL", amount: -2000000, description: "تسویه درخواستی منتور", createdAt: ago(10) },
    ],
  });
  await db.commission.create({ data: { mentorId: mentorUser.id, amount: 1440000, percent: 30, status: "SETTLED", createdAt: ago(25) } });
  await db.commission.create({ data: { mentorId: mentorUser.id, amount: 870000, percent: 30, status: "PENDING", createdAt: ago(2) } });
  await db.commission.create({ data: { mentorId: mentor2.id, amount: 690000, percent: 30, status: "PENDING", createdAt: ago(3) } });

  // ---- tickets ----
  const t1 = await db.ticket.create({
    data: { subject: "مشکل در پخش ویدیوی درس چهارم", userId: student.id, category: "TECHNICAL", priority: "HIGH", status: "ANSWERED", createdAt: ago(2) },
  });
  await db.ticketMessage.createMany({
    data: [
      { ticketId: t1.id, body: "سلام، ویدیوی درس چهارم فصل دوم بعد از دقیقه ۱۰ قطع می‌شه. چند بار هم کش رو پاک کردم.", isStaff: false, createdAt: ago(2) },
      { ticketId: t1.id, body: "سلام علی عزیز، ممنون از اطلاع‌رسانی. فایل جایگزین آپلود شد، لطفاً یکبار دیگر امتحان کنید. اگر مشکل ادامه داشت اطلاع بدید. 🙏", isStaff: true, createdAt: ago(1) },
    ],
  });
  const t2 = await db.ticket.create({
    data: { subject: "درخواست فاکتور رسمی برای دوره", userId: student.id, category: "BILLING", priority: "MEDIUM", status: "OPEN", createdAt: ago(1) },
  });
  await db.ticketMessage.create({ data: { ticketId: t2.id, body: "سلام، برای دوره پرایس اکشن فاکتور رسمی با مهر نیاز دارم.", isStaff: false, createdAt: ago(1) } });
  const t3 = await db.ticket.create({
    data: { subject: "سوال درباره تمدید منتورینگ", userId: extraStudents[2].id, category: "GENERAL", priority: "LOW", status: "OPEN", createdAt: ago(0) },
  });

  // ---- messages ----
  await db.message.createMany({
    data: [
      { senderId: mentorUser.id, receiverId: student.id, conversationId: `${mentorUser.id}:${student.id}`, body: "سلام علی جان 👋 تمرین بک‌تست این هفته رو شروع کردی؟", createdAt: ago(0, 5) },
      { senderId: student.id, receiverId: mentorUser.id, conversationId: `${mentorUser.id}:${student.id}`, body: "سلام استاد، بله ۱۲ تا از ۲۰ معامله رو انجام دادم، فردا کاملش می‌کنم.", createdAt: ago(0, 4) },
      { senderId: mentorUser.id, receiverId: student.id, conversationId: `${mentorUser.id}:${student.id}`, body: "عالیه! جلسه هفته روی مدیریت پارشیال تمرکز داریم، چارت‌هات رو آماده داشته باش.", createdAt: ago(0, 3) },
    ],
  });

  // ---- notifications ----
  await db.notification.createMany({
    data: [
      { userId: student.id, title: "تکلیف جدید ثبت شد", body: "تمرین «محاسبه سایز پوزیشن» تا ۹ روز دیگر مهلت دارد.", type: "ASSIGNMENT", createdAt: ago(1) },
      { userId: student.id, title: "جلسه منتورینگ فردا", body: "جلسه هفتم با استاد رضایی فردا ساعت ۱۸:۰۰ برگزار می‌شود.", type: "SESSION", createdAt: ago(0, 6) },
      { userId: student.id, title: "پرداخت موفق", body: "پرداخت شما برای دوره مدیریت سرمایه با موفقیت انجام شد.", type: "PAYMENT", isRead: true, createdAt: ago(18) },
      { userId: student.id, title: "درس جدید اضافه شد", body: "درس «مدل ورود چند زمانی» به دوره پرایس اکشن اضافه شد.", type: "COURSE", createdAt: ago(3) },
      { userId: student.id, title: "بازخورد منتور روی تمرین شما", body: "امیرحسین رضایی تمرین XAUUSD شما را با نمره ۹۲ بررسی کرد.", type: "ASSIGNMENT", createdAt: ago(5) },
      { userId: admin.id, title: "گزارش فروش روزانه", body: "دیروز ۴ سفارش جدید به ارزش ۱۲,۸۰۰,۰۰۰ تومان ثبت شد.", type: "SYSTEM", createdAt: ago(0, 2) },
    ],
  });

  // ---- blog ----
  const blogData = [
    ["راهنمای کامل ساخت پلن معاملاتی شخصی", "trading-plan-guide", "تحلیل بازار", "پلن معاملاتی چیست و چطور یک پلن شخصی‌سازی‌شده بنویسیم که واقعاً به آن پایبند بمانیم؟ در این مقاله قالب کامل + مثال عملی ارائه می‌دهیم.", 8, ago(2)],
    ["۵ اشتباه مرگبار در مدیریت سرمایه", "risk-management-mistakes", "مدیریت سرمایه", "ریسک بیش از حد، میارسینگ بدون محاسبه، نداشتن حد ضرر و… این اشتباهات حساب‌های زیادی را نابود کرده‌اند. بیاموزید چطور از آن‌ها دوری کنید.", 6, ago(5)],
    ["اسمارت مانی کانسپت؛ واقعیت یا شعار؟", "smc-reality", "تحلیل بازار", "بررسی منصفانه SMC: چه بخش‌هایی از این متد واقعاً کار می‌کند و کجاها در توهم می‌افتیم؟ با مثال‌های چارت واقعی.", 11, ago(9)],
    ["چطور در سشن لندن معامله کنیم؟", "london-session", "استراتژی", "سشن لندن پرنوسان‌ترین ساعت‌های بازار است. ستاپ‌های اختصاصی این سشن و نکات مدیریت ریسک آن را مرور می‌کنیم.", 7, ago(14)],
    ["روانشناسی ضرر؛ چطور بعد از لوز بازی کنیم؟", "loss-psychology", "روانشناسی", "ضرر بخش جدایی‌ناپذیر معامله‌گری است، اما واکنش ما به آن تعیین‌کننده است. راهکارهای علمی برای برگشت به مسیر.", 9, ago(20)],
    ["چک‌لیست قبل از هر معامله", "pre-trade-checklist", "استراتژی", "قبل از کلیک روی دکمه خرید/فروش، این ۱۲ مورد را چک کنید. چک‌لیست قابل چاپ هم پیوست مقاله است.", 4, ago(26)],
  ] as const;
  for (const [title, slug, category, excerpt, readTimeMin, createdAt] of blogData) {
    await db.blogPost.create({
      data: {
        title, slug, category, excerpt, readTimeMin, createdAt,
        content: `${excerpt}\n\n## چرا این موضوع مهم است؟\nدر بازارهای مالی، تفاوت بین معامله‌گر موفق و ناموفق معمولاً در جزئیات اجرا است. در این مقاله تلاش کرده‌ایم مهم‌ترین نکات کاربردی را بدون حاشیه جمع‌بندی کنیم.\n\n## نکات کلیدی\n- ابتدا ساختار تایم بالاتر را مشخص کنید\n- ریسک هر معامله را حداکثر ۱ تا ۲ درصد حساب قرار دهید\n- ژورنال‌نویسی را جدی بگیرید؛ داده‌ها دروغ نمی‌گویند\n- بعد از هر ستاپ، نتیجه را با پلن مقایسه کنید نه با احساسات\n\n## جمع‌بندی\nمسیر حرفه‌ای شدن مسیر تمرین و تکرار هوشمندانه است. اگر این مقاله برایتان مفید بود، آن را با هم‌مسیرهایتان به اشتراک بگذارید و در دوره‌های تخصصی دی‌صفارا همراه ما باشید.`,
        views: 400 + Math.floor(Math.random() * 4000),
      },
    });
  }

  // ---- testimonials, faq, resources ----
  const testiData = [
    ["امیر محمدی", "دانشجوی مسیر حرفه‌ای", "بعد از دو سال سردرگمی، با منتورینگ دی‌صفارا بالاخره فهمیدم مشکل کجاست: نداشتن پلن. الان سه ماهه پیوسته سودده‌ام.", 5],
    ["نیلوفر احمدی", "دانشجوی دوره پرایس اکشن", "بهترین بخش کار، ژورنال معاملات و بازخورد منتوره. هر هفته می‌فهمم دقیقاً کجا اشتباه کردم.", 5],
    ["سعید رحیمی", "تریدر فارکس", "ورک‌اسپیس معاملاتی سایت فوق‌العاده‌ست؛ تمرین‌هام رو مستقیم روی چارت انجام می‌دم و استاد مارک‌آپم رو اصلاح می‌کنه.", 5],
    ["مریم کاظمی", "دانشجوی SMC", "پشتیبانی واقعاً سریعه و محتوا بی‌نظیر. از صفر شروع کردم و الان تحلیل مستقل انجام می‌دم.", 4],
    ["حسین توکلی", "معامله‌گر طلا", "استراتژی طلای دی‌صفارا نگاهم رو به XAUUSD کاملاً عوض کرد. ریسک به ریوارد معاملاتم دو برابر شد.", 5],
  ] as const;
  for (const [name, role, content, rating] of testiData) {
    await db.testimonial.create({ data: { name, role, content, rating } });
  }

  const faqData = [
    ["آیا برای شروع به دانش قبلی نیاز دارم؟", "خیر. مسیر «صفر تا معامله‌گر حرفه‌ای» دقیقاً برای افراد بدون پیش‌زمینه طراحی شده و از مفاهیم پایه شروع می‌کند.", "دوره‌ها"],
    ["دوره‌ها به‌صورت حضوری است یا آنلاین؟", "تمام دوره‌ها و جلسات منتورینگ به‌صورت آنلاین برگزار می‌شوند و ویدیوها به‌صورت همیشگی در پنل شما در دسترس است.", "دوره‌ها"],
    ["اگر از دوره راضی نباشم امکان بازگشت وجه هست؟", "بله؛ تا ۷ روز پس از خرید، اگر کمتر از ۲۰٪ دوره را مشاهده کرده باشید، وجه به‌طور کامل بازگردانده می‌شود.", "پرداخت"],
    ["منتورینگ چطور برگزار می‌شود؟", "پس از ثبت‌نام، منتور متناسب با سطح شما تعیین می‌شود و جلسات هفتگی از طریق پنل و ویدئوکنفرانس برگزار می‌گردد.", "منتورینگ"],
    ["حداقل سرمایه برای شروع معامله چقدر است؟", "برای یادگیری، حساب دمو کافی است. برای ورود به بازار واقعی پیشنهاد ما شروع با سرمایه‌ای است که از دست رفتنش آسیب جدی به زندگی‌تان نزند.", "عمومی"],
    ["آیا بعد از دوره مدرک می‌گیرم؟", "بله، پس از اتمام دوره و قبولی در آزمون پایانی، گواهینامه معتبر دی‌صفارا با سری‌ال یکتا صادر می‌شود.", "دوره‌ها"],
  ] as const;
  for (let i = 0; i < faqData.length; i++) {
    const [question, answer, category] = faqData[i];
    await db.faq.create({ data: { question, answer, category, order: i } });
  }

  const resData = [
    ["چک‌لیست PDF قبل از معامله", "۱۲ مورد ضروری که قبل از هر ورود باید چک کنید", "PDF", "۱.۲ مگابایت"],
    ["قالب اکسل ژورنال معاملات", "ژورنال ساده با محاسبات خودکار وین‌ریت و دراودان", "PDF", "۸۴۰ کیلوبایت"],
    ["ویدیوی رایگان: مقدمه پرایس اکشن", "اولین درس دوره پرایس اکشن به‌صورت رایگان", "VIDEO", "۲۵ دقیقه"],
    ["راهنمای انتخاب بروکر معتبر", "معیارهای امنیت، اسپرد و برداشت وجه", "PDF", "۹۸۰ کیلوبایت"],
    ["چارت تمرینی هفتگی", "هر هفته یک چارت واقعی برای تمرین تحلیل با پاسخ تشریحی", "PDF", "۶۴۰ کیلوبایت"],
  ] as const;
  for (const [title, description, type, size] of resData) {
    await db.freeResource.create({ data: { title, description, type, size, downloads: Math.floor(Math.random() * 5000) + 300 } });
  }

  // ---- certificates ----
  await db.certificate.create({
    data: { serial: "DS-CERT-1403-0231", userId: student.id, courseId: courses["risk-management-pro"], title: "گواهینامه مدیریت سرمایه و ریسک حرفه‌ای", issuedAt: ago(10) },
  });

  // ---- recruitment ----
  await db.jobPosting.createMany({
    data: [
      { title: "تحلیلگر محتوا (بازار مالی)", department: "محتوا", description: "تولید تحلیل روزانه بازار و محتوای آموزشی در شبکه‌های اجتماعی.", type: "FULL_TIME" },
      { title: "پشتیبان فنی پلتفرم", department: "پشتیبانی", description: "پاسخگویی به تیکت‌ها و مشکلات فنی کاربران در شیفت عصر.", type: "PART_TIME" },
      { title: "منتور تحلیل تکنیکال", department: "آموزش", description: "برگزاری جلسات منتورینگ و بازبینی تمرین‌های دانشجویان.", type: "FULL_TIME" },
    ],
  });
  await db.jobApplication.createMany({
    data: [
      { name: "ابوالفضل صادقی", email: "ab@ex.com", phone: "09351112233", resumeText: "۵ سال سابقه تولید محتوای مالی در کانال‌های تلگرامی", status: "INTERVIEW", interviewAt: ahead(3), createdAt: ago(4) },
      { name: "الهه کریمی", email: "elahe@ex.com", phone: "09364445566", resumeText: "کارشناس پشتیبانی سابق بروکر آلپاری", status: "PENDING", createdAt: ago(2) },
      { name: "مجید نادری", email: "majid@ex.com", phone: "09377778899", resumeText: "مدرس تکنیکال با ۸ سال تجربه", status: "ACCEPTED", createdAt: ago(8) },
      { name: "شیوا محمدخانی", email: "shiva@ex.com", phone: "09382223344", resumeText: "تریدر فارکس و منتور", status: "REJECTED", createdAt: ago(12) },
    ],
  });

  // ---- coupons & audit & settings ----
  await db.coupon.createMany({
    data: [
      { code: "WELCOME15", percentOff: 15, maxUses: 500, usedCount: 132, expiresAt: ahead(30) },
      { code: "YALDA40", percentOff: 40, maxUses: 200, usedCount: 187, expiresAt: ahead(12) },
    ],
  });
  await db.auditLog.createMany({
    data: [
      { actorName: "مدیر دی‌صفارا", action: "تایید پرداخت", entity: "سفارش DS-1042", detail: "پرداخت دستی تایید شد", createdAt: ago(25) },
      { actorName: "سیستم", action: "صادر کردن گواهینامه", entity: "علی کریمی", createdAt: ago(10) },
      { actorName: "مدیر دی‌صفارا", action: "ایجاد کد تخفیف", entity: "کوپن WELCOME15", createdAt: ago(30) },
      { actorName: "امیرحسین رضایی", action: "بررسی تمرین معاملاتی", entity: "تمرین XAUUSD علی کریمی", createdAt: ago(5) },
    ],
  });
  await db.setting.createMany({
    data: [
      { key: "site_title", value: "دی‌صفارا | آکادمی تخصصی آموزش ترید" },
      { key: "payment_gateway", value: "زرین‌پال" },
      { key: "support_phone", value: "۰۲۱-۹۱۰۰۲۲۳۳" },
      { key: "mentor_commission_percent", value: "30" },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("   Admin: 09120000000 | Mentor: 09121111111 | Student: 09123333333");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
