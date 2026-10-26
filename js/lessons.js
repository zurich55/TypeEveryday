// Comprehensive 6-Level Curriculum from Beginner to Programmer

// Level pass thresholds and character length caps
// Level 1-2: 80-120 characters; Level 3-6: 120-200 characters (fits typing box without scrollbar)
export const LESSON_LENGTH_CAPS = {
  1: { min: 80, max: 120 },
  2: { min: 80, max: 120 },
  3: { min: 120, max: 200 },
  4: { min: 120, max: 200 },
  5: { min: 120, max: 200 },
  6: { min: 120, max: 200 }
};

export const LEVEL_PASS_THRESHOLDS = {
  1: { wpm: 15, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  2: { wpm: 20, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  3: { wpm: 25, accuracy: 95, minKeyAccuracy: 90, minLength: 120, maxLength: 200 },
  4: { wpm: 35, accuracy: 95, minKeyAccuracy: 90, minLength: 120, maxLength: 200 },
  5: { wpm: 25, accuracy: 95, minKeyAccuracy: 90, minLength: 120, maxLength: 200 },
  6: { wpm: 30, accuracy: 95, minKeyAccuracy: 90, minLength: 120, maxLength: 200 },

  // Level 2 gradual thresholds: 16-20 WPM rising to 22 for final test
  '2-1': { wpm: 16, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  '2-2': { wpm: 16, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  '2-3': { wpm: 17, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  '2-4': { wpm: 17, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  '2-5': { wpm: 18, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  '2-6': { wpm: 18, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  '2-7': { wpm: 19, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  '2-8': { wpm: 19, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  '2-9': { wpm: 20, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  '2-10': { wpm: 20, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 },
  '2-11': { wpm: 22, accuracy: 95, minKeyAccuracy: 90, minLength: 80, maxLength: 120 }
};

export const LESSON_LEVELS = [
  {
    id: 1,
    title: 'Level 1: Home Row (แป้นวางนิ้วหลัก)',
    description: 'ฝึกวางนิ้วที่จุดเริ่มต้น asdf jkl; โดยไม่ต้องก้มมองคีย์บอร์ด สังเกตตุ่มนูนที่ปุ่ม F และ J',
    icon: '🏠',
    lengthCap: { min: 80, max: 120 },
    lessons: [
      {
        id: '1-1',
        title: '1.1 ปุ่ม Anchor นิ้วชี้ F และ J',
        targetWpm: 12,
        minAccuracy: 95,
        tips: 'สัมผัสตุ่มนูนบนปุ่ม F (นิ้วชี้ซ้าย) และ J (นิ้วชี้ขวา) เป็นจุดพักนิ้วหลัก',
        text: 'fj jf ff jj fjf jfj fff jjj jff fjj ffjj jjff f j fj jf fjf jfj ff jj f j fj jf fj jf'
      },
      {
        id: '1-2',
        title: '1.2 ปุ่ม D และ K (นิ้วกลาง)',
        targetWpm: 14,
        minAccuracy: 95,
        tips: 'ใช้นิ้วกลางซ้ายกด D และนิ้วกลางขวากด K นิ้วชี้ยังคงแตะอยู่ที่ F และ J',
        text: 'dk kd dd kk dkd kdk ddf jjk f d j k df jk kf jd fjdk ddf jjk dk kd dkd kdk df jk kd dk'
      },
      {
        id: '1-3',
        title: '1.3 ปุ่ม S และ L (นิ้วนาง)',
        targetWpm: 15,
        minAccuracy: 95,
        tips: 'ใช้นิ้วนางซ้ายกด S และนิ้วนางขวากด L อย่าเพิ่งยกทั้งมือขึ้น พยายามขยับแค่นิ้ว',
        text: 'sl ls sls lsl as df jk l; sad lad ask dad fall all flask salad salsa dallas fall flask ask salad lad'
      },
      {
        id: '1-4',
        title: '1.4 ปุ่ม A และ ; (นิ้วก้อยสุดแกร่ง)',
        targetWpm: 15,
        minAccuracy: 95,
        tips: 'นิ้วก้อยซ้ายกด A นิ้วก้อยขวากด ; แม้จะรู้สึกไม่ชินในตอนแรก แต่ฝึกบ่อยๆ จะคล่องขึ้น',
        text: 'a; ;a a;a ;a; asdf jkl; flask salad salsa fall ask dad lad alas glad dash flash glass had gas fall;'
      },
      {
        id: '1-5',
        title: '1.5 ปุ่มกึ่งกลาง G และ H (นิ้วชี้เอื้อม)',
        targetWpm: 16,
        minAccuracy: 95,
        tips: 'นิ้วชี้ซ้ายเอื้อมไปกด G แล้วกลับมา F, นิ้วชี้ขวาเอื้อมไปกด H แล้วกลับมา J',
        text: 'gh hg ghg hgh fg jh fgh jhg flag glad half dash flash glass gas had has glad flag half dash glass gas'
      },
      {
        id: '1-6',
        title: '1.6 ทดสอบผ่านระดับ Home Row Mastery',
        targetWpm: 18,
        minAccuracy: 95,
        tips: 'บททดสอบจบเลเวล 1: พิมพ์คำจริงจากแถว Home Row โดยสายตามองแต่หน้าจอเท่านั้น!',
        text: 'a lad asks a dad; dad has a salad; a sad lad had a flash; glad dash fall all salad flask'
      }
    ]
  },
  {
    id: 2,
    title: 'Level 2: Top & Bottom Rows (แถวบนและแถวล่าง)',
    description: 'ขยายขอบเขตจากแถวกลางขึ้นไปแถวบน (QWERTY) และลงมาแถวล่าง (ZXCVB) ฝึกขยับนิ้วขึ้นลงอย่างแม่นยำ',
    icon: '🚀',
    lengthCap: { min: 80, max: 120 },
    lessons: [
      {
        id: '2-1',
        title: '2.1 แถวบน: E และ I (นิ้วกลางซ้าย-ขวา)',
        targetWpm: 16,
        minAccuracy: 95,
        tips: 'D ขยับขึ้นไป E (นิ้วกลางซ้าย), K ขยับขึ้นไป I (นิ้วกลางขวา) ขยับขึ้นแล้วดึงกลับจุด Anchor',
        text: 'die lie file like sail side hide life desk fail safe dial leak fish shed kid seal feed'
      },
      {
        id: '2-2',
        title: '2.2 แถวบน: R และ U (นิ้วชี้ซ้าย-ขวา)',
        targetWpm: 16,
        minAccuracy: 95,
        tips: 'F ขยับขึ้นไป R (นิ้วชี้ซ้าย), J ขยับขึ้นไป U (นิ้วชี้ขวา) ใช้นิ้วชี้เอื้อมตรงขึ้นแถวบน',
        text: 'red fir rue ire user fire free ride risk sure rule rush rude duel feud fur surf dear hear hair dark hard'
      },
      {
        id: '2-3',
        title: '2.3 แถวบน: T และ Y (นิ้วชี้เอื้อมใน)',
        targetWpm: 17,
        minAccuracy: 95,
        tips: 'F เอื้อมขึ้นในไป T (นิ้วชี้ซ้าย), J เอื้อมขึ้นในไป Y (นิ้วชี้ขวา) เอื้อมแล้วดึงกลับจุดพัก',
        text: 'stay star easy duty fast tree late tell rate tail tray dry yeast trust trait treat test rest'
      },
      {
        id: '2-4',
        title: '2.4 แถวบน: W และ O (นิ้วนางซ้าย-ขวา)',
        targetWpm: 17,
        minAccuracy: 95,
        tips: 'S ขยับขึ้นไป W (นิ้วนางซ้าย), L ขยับขึ้นไป O (นิ้วนางขวา) ฝึกการควบคุมนิ้วนางให้เป็นอิสระ',
        text: 'two out how word show work flow slow wood look foot root tool wait wolf soft door hook took'
      },
      {
        id: '2-5',
        title: '2.5 แถวบน: Q และ P (นิ้วก้อยซ้าย-ขวา)',
        targetWpm: 18,
        minAccuracy: 95,
        tips: 'A ขยับขึ้นไป Q (นิ้วก้อยซ้าย), ; ขยับขึ้นไป P (นิ้วก้อยขวา) ปลดล็อกครบทุกปุ่มแถวบน QWERTY',
        text: 'quit quiet play post hope keep deep path drop equip quote pool part pure spot step stop poor page pipe'
      },
      {
        id: '2-6',
        title: '2.6 แถวล่าง: V และ M (นิ้วชี้ลงล่าง)',
        targetWpm: 18,
        minAccuracy: 95,
        tips: 'F ขยับลงมา V (นิ้วชี้ซ้าย), J ขยับลงมา M (นิ้วชี้ขวา) เริ่มต้นแถวล่างด้วยนิ้วชี้ที่คล่องแคล่ว',
        text: 'move view time home game swim team give live five save warm farm wave movie make same have more'
      },
      {
        id: '2-7',
        title: '2.7 แถวล่าง: C และ Comma (นิ้วกลางลงล่าง)',
        targetWpm: 19,
        minAccuracy: 95,
        tips: 'D ขยับลงมา C (นิ้วกลางซ้าย), K ขยับลงมา Comma (,) (นิ้วกลางขวา)',
        text: 'come, cake, cold, cool, face, fact, city, code, case, card, care, deck, rock, calm, much, rich'
      },
      {
        id: '2-8',
        title: '2.8 แถวล่าง: B และ N (นิ้วชี้เอื้อมลงใน)',
        targetWpm: 19,
        minAccuracy: 95,
        tips: 'F เอื้อมลงในไป B (นิ้วชี้ซ้าย), J เอื้อมลงในไป N (นิ้วชี้ขวา)',
        text: 'book best back baby boat bank rain wind open line plan hand town born bond bent burn bone nine'
      },
      {
        id: '2-9',
        title: '2.9 แถวล่าง: X และ Dot (นิ้วนางลงล่าง)',
        targetWpm: 20,
        minAccuracy: 95,
        tips: 'S ขยับลงมา X (นิ้วนางซ้าย), L ขยับลงมา Dot (.) (นิ้วนางขวา)',
        text: 'next text exam fix mix box six taxi. run. walk. keep. help. play. good. open. plan. calm. time.'
      },
      {
        id: '2-10',
        title: '2.10 แถวล่าง: Z และ Slash (นิ้วก้อยลงล่าง)',
        targetWpm: 20,
        minAccuracy: 95,
        tips: 'A ขยับลงมา Z (นิ้วก้อยซ้าย), ; ขยับลงมา Slash (/) (นิ้วก้อยขวา) ปลดล็อกครบทุกปุ่มแถวล่าง',
        text: 'zero zone size lazy zoom maze buzz quiz prize jazz in/out on/off up/down day/night true/false'
      },
      {
        id: '2-11',
        title: '2.11 ทดสอบผ่านระดับ All Letters Integration',
        targetWpm: 22,
        minAccuracy: 95,
        tips: 'บททดสอบจบเลเวล 2: ประโยคภาษาอังกฤษที่มีตัวอักษร A-Z ครบทุกตัว เพื่อทดสอบความจำกล้ามเนื้อทั้งสองมือ',
        text: 'the quick brown fox jumps over the lazy dog. pack my box with five dozen liquor jugs.'
      }
    ]
  },
  {
    id: 3,
    title: 'Level 3: Capitals, Numbers & Punctuation (Shift & ตัวเลข)',
    description: 'ก้าวข้ามการมองคีย์บอร์ดด้วยการฝึกใช้ปุ่ม Shift ตรงข้ามมือ พร้อมตัวเลขและเครื่องหมายวรรคตอน',
    icon: '⚡',
    lengthCap: { min: 120, max: 200 },
    lessons: [
      {
        id: '3-1',
        title: '3.1 ปุ่ม Shift ข้ามมือ (Opposite-hand Shift)',
        targetWpm: 22,
        minAccuracy: 95,
        tips: 'กฎเหล็ก: ตัวอักษรมือซ้าย ให้กด Shift ขวาด้วยนิ้วก้อยขวา / ตัวอักษรมือขวา ให้กด Shift ซ้ายด้วยนิ้วก้อยซ้าย',
        text: 'Apple Bangkok Tokyo Paris London Berlin Jakarta Madrid Rome Vienna Apple Bangkok Tokyo Paris London Berlin Jakarta Rome Vienna'
      },
      {
        id: '3-2',
        title: '3.2 แถวตัวเลข 1 ถึง 0 (Top Reach)',
        targetWpm: 20,
        minAccuracy: 95,
        tips: 'เอื้อมนิ้วจากแถวกลางขึ้นไปยังตัวเลขตามนิ้วประจำตำแหน่ง (1=ก้อยซ้าย, 2=นางซ้าย... 0=ก้อยขวา)',
        text: '123 456 789 012 2024 1995 8080 3000 404 500 1024 42 777 999 123 456 789 2024 1995 8080 3000 404 500 1024 777 999 123 456'
      },
      {
        id: '3-3',
        title: '3.3 เครื่องหมายวรรคตอนพื้นฐาน (?, !, -, ", \')',
        targetWpm: 22,
        minAccuracy: 95,
        tips: 'ฝึกการผสมผสาน Shift เพื่อพิมพ์เครื่องหมายคำถาม คำอุทาน และเครื่องหมายคำพูด',
        text: 'Hello! How are you? It\'s a good day - don\'t forget to say "thank you" always. Keep going! Good job - see you tomorrow morning.'
      },
      {
        id: '3-4',
        title: '3.4 ทดสอบผ่านระดับ Alphanumeric Test',
        targetWpm: 25,
        minAccuracy: 95,
        tips: 'ข้อความผสมผสานชื่อเฉพาะ ตัวเลข และเครื่องหมายวรรคตอนอย่างเป็นธรรมชาติ',
        text: 'Room 402 is ready at 9:30 AM! Please call John\'s phone: 081-234-5678, ok? Meet us at Gate 5 before 11:45 PM. Ticket #204 ready.'
      }
    ]
  },
  {
    id: 4,
    title: 'Level 4: Real English Words & Sentences (คำและประโยคจริง)',
    description: 'สร้างจังหวะการพิมพ์ที่ลื่นไหล (Flow State) ด้วยคำศัพท์ที่พบบ่อย 100 คำ และประโยคในชีวิตจริงและการทำงาน',
    icon: '📖',
    lengthCap: { min: 120, max: 200 },
    lessons: [
      {
        id: '4-1',
        title: '4.1 50 คำภาษาอังกฤษยอดนิยม (High Frequency Words)',
        targetWpm: 28,
        minAccuracy: 95,
        tips: 'อย่าคิดเป็นตัวอักษร ให้มองเป็น "คำทั้งคำ" แล้วปล่อยให้นิ้วพิมพ์ออกไปเป็นจังหวะเพลง',
        text: 'the of and a to in is you that it he was for on are as with his they at be this have from or one had by word but not what all were we when your can said there use an each which she do how their'
      },
      {
        id: '4-2',
        title: '4.2 ประโยคทั่วไปในชีวิตประจำวัน (Everyday Fluency)',
        targetWpm: 30,
        minAccuracy: 95,
        tips: 'รักษาความเร็วให้สม่ำเสมอ ความแม่นยำสำคัญกว่าความรีบร้อน',
        text: 'Consistency is the key to mastering touch typing. Every minute of practice trains your muscle memory until your fingers move automatically without any conscious thought.'
      },
      {
        id: '4-3',
        title: '4.3 คำศัพท์เทคนิคคอมพิวเตอร์ (Tech & Dev Vocabulary)',
        targetWpm: 32,
        minAccuracy: 95,
        tips: 'คำศัพท์ที่โปรแกรมเมอร์เจอบ่อยในเอกสารและโค้ด',
        text: 'algorithm boolean compiler database function interface memory network protocol variable repository terminal framework responsive asynchronous'
      },
      {
        id: '4-4',
        title: '4.4 ทดสอบผ่านระดับ Speed & Rhythm Sprint',
        targetWpm: 35,
        minAccuracy: 95,
        tips: 'พิมพ์ให้ได้เกิน 35 WPM โดยมีความแม่นยำสูงกว่า 95% เพื่อปลดล็อกสู่ระดับโปรแกรมเมอร์!',
        text: 'Software engineering requires clear thinking, clean code, and fast typing skills to quickly translate your ideas into working computer programs.'
      }
    ]
  },
  {
    id: 5,
    title: 'Level 5: Code Symbols (สัญลักษณ์สำหรับโปรแกรมเมอร์)',
    description: 'โปรแกรมเมอร์มักติดขัดที่สัญลักษณ์พิเศษ! เจาะลึกวงเล็บ { } [ ] ( ) ตัวเปรียบเทียบ และเครื่องหมายตรรกะ',
    icon: '⚙️',
    lengthCap: { min: 120, max: 200 },
    lessons: [
      {
        id: '5-1',
        title: '5.1 วงเล็บทุกรูปแบบ: ( ) [ ] { } < >',
        targetWpm: 25,
        minAccuracy: 95,
        tips: 'นิ้วก้อยขวาคุม [ ] และ { } / นิ้วกลาง-นางขวาคุม ( ) / Shift+, และ Shift+. สำหรับ < >',
        text: '(x) [0] {key} <div /> ({id}) [[item]] {status: ok} <T extends any> [x, y, z] (data) {value: 1} [item] <Props> ({id: 2}) <App>'
      },
      {
        id: '5-2',
        title: '5.2 ตัวดำเนินการและเงื่อนไข (= == != += <= >= && ||)',
        targetWpm: 26,
        minAccuracy: 95,
        tips: 'สังเกตตำแหน่งเครื่องหมาย = (นิ้วก้อยขวาบน) และ Shift+7 (&), Shift+\\ (|)',
        text: 'x = 10; if (a == b && c != d) { count += 1; isValid = score >= 50 || hasPass; isDone = count > 0 && ready; flag = !isDone; }'
      },
      {
        id: '5-3',
        title: '5.3 เครื่องหมายเชื่อมต่อโครงสร้าง (; : " \' / \\ _ - $ @)',
        targetWpm: 26,
        minAccuracy: 95,
        tips: 'นิ้วก้อยขวาเป็นนิ้วที่ทำงานหนักที่สุดของโปรแกรมเมอร์ ฝึกให้ยืดหยุ่นและผ่อนคลาย',
        text: '"user_id": $token; path/to/file.ts -> env["API_KEY"] /* comment */ --flag: true; "status": 200; token = $auth; const TAG = "dev";'
      },
      {
        id: '5-4',
        title: '5.4 ทดสอบผ่านระดับ Code Symbols Gauntlet',
        targetWpm: 28,
        minAccuracy: 95,
        tips: 'ด่านทดสอบสัญลักษณ์ล้วนๆ ที่จะทำให้คุณพิมพ์โค้ดได้โดยไม่ต้องชะงักมองแป้นตัวเลข!',
        text: 'const config = { host: "127.0.0.1", port: 8080, ssl: false, tags: ["web", "api"] }; const app = { debug: true }; port = 3000;'
      }
    ]
  },
  {
    id: 6,
    title: 'Level 6: Real Code Snippets (เขียนโค้ดจริงระดับโปรแกรมเมอร์)',
    description: 'ระดับสูงสุด! ฝึกพิมพ์โค้ดจริงใน JavaScript, Python, HTML/CSS และ Shell commands เหมือนกำลังทำงานจริง',
    icon: '💻',
    lengthCap: { min: 120, max: 200 },
    lessons: [
      {
        id: '6-1',
        title: '6.1 JavaScript & TypeScript Snippets',
        targetWpm: 32,
        minAccuracy: 95,
        tips: 'ฟังก์ชันลูกศร async/await และ destructuring ที่พบบ่อยในงาน modern web',
        text: 'async function fetchUser(id) {\n  const res = await api.get(`/users/${id}`);\n  return res.data.map(u => ({ ...u, active: true }));\n}'
      },
      {
        id: '6-2',
        title: '6.2 Python Snippets (Clean Indentation & Colons)',
        targetWpm: 32,
        minAccuracy: 95,
        tips: 'สังเกตเครื่องหมายโคลอน (:) และ indentation วงเล็บเหล็ก list comprehension',
        text: 'def calculate_scores(students):\n    return [s["name"] for s in students if s["score"] >= 80 and s.get("passed", False) is True]'
      },
      {
        id: '6-3',
        title: '6.3 HTML & CSS Snippets',
        targetWpm: 30,
        minAccuracy: 95,
        tips: 'แท็กเปิด-ปิด <button>, class attributes, และ CSS syntax',
        text: '<button class="btn btn-primary" onClick={handleClick}>\n  <span style={{ display: "flex", gap: "8px" }}>Save</span>\n</button>'
      },
      {
        id: '6-4',
        title: '6.4 Shell & Git Terminal Commands',
        targetWpm: 34,
        minAccuracy: 95,
        tips: 'คำสั่งใน Command Line ที่โปรแกรมเมอร์ทุกคนต้องพิมพ์ทุกวัน',
        text: 'git checkout -b feature/login && git add . && git commit -m "feat: add auth" && git push origin HEAD && git status && git log'
      },
      {
        id: '6-5',
        title: '6.5 Master Developer Final Exam 🏆',
        targetWpm: 38,
        minAccuracy: 95,
        tips: 'บททดสอบสุดท้ายสู่ระดับ Pro Coder! พิมพ์โค้ดจริงอย่างแม่นยำ รวดเร็ว และเป็นมืออาชีพ',
        text: 'export const useStore = create((set) => ({\n  count: 0,\n  inc: () => set((state) => ({ count: state.count + 1 })),\n  reset: () => set({ count: 0 })\n}));'
      }
    ]
  }
];

export const PLACEMENT_TEST_TEXT = 'Welcome to Touch Typing Master! The quick brown fox jumps over 10 lazy dogs. const result = items.filter(x => x > 0);';

export const LESSON_TARGET_KEYS = {
  '1-1': ['f', 'j'],
  '1-2': ['d', 'k'],
  '1-3': ['s', 'l'],
  '1-4': ['a', ';'],
  '1-5': ['g', 'h'],
  '1-6': ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  '2-1': ['e', 'i'],
  '2-2': ['r', 'u'],
  '2-3': ['t', 'y'],
  '2-4': ['w', 'o'],
  '2-5': ['q', 'p'],
  '2-6': ['v', 'm'],
  '2-7': ['c', ','],
  '2-8': ['b', 'n'],
  '2-9': ['x', '.'],
  '2-10': ['z', '/'],
  '2-11': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
  '3-1': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
  '3-2': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  '3-3': ['?', '!', '-', '"', "'"],
  '3-4': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '?', '!', '-', '"', "'", ':', '.'],
  '4-1': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
  '4-2': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
  '4-3': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
  '4-4': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
  '5-1': ['(', ')', '[', ']', '{', '}', '<', '>'],
  '5-2': ['=', '!', '&', '|', '<', '>'],
  '5-3': [';', ':', '"', "'", '/', '\\', '_', '-', '$', '@'],
  '5-4': ['{', '}', '[', ']', '(', ')', '=', ':', ';', '"', ',', '.'],
  '6-1': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '(', ')', '{', '}', ';', '=', '>'],
  '6-2': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '[', ']', ':', '_', '"'],
  '6-3': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '<', '>', '/', '=', '"'],
  '6-4': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '-', '&', '.', '"'],
  '6-5': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '(', ')', '{', '}', '=', '>', '+', ':']
};

/**
 * Returns all unlocked keys up to and including the specified lesson ID.
 */
export function getLessonUnlockedKeys(lessonId) {
  const allLessonIds = [
    '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
    '2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7', '2-8', '2-9', '2-10', '2-11',
    '3-1', '3-2', '3-3', '3-4',
    '4-1', '4-2', '4-3', '4-4',
    '5-1', '5-2', '5-3', '5-4',
    '6-1', '6-2', '6-3', '6-4', '6-5'
  ];
  const idx = allLessonIds.indexOf(lessonId);
  const upToIds = idx === -1 ? allLessonIds : allLessonIds.slice(0, idx + 1);
  const keysSet = new Set();
  upToIds.forEach(id => {
    const keys = LESSON_TARGET_KEYS[id] || [];
    keys.forEach(k => keysSet.add(k.toLowerCase()));
  });
  return Array.from(keysSet);
}
