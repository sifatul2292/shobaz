/**
 * Seed script — adds 35 books as products to shobaz MongoDB.
 * Run from /backend: node seed-books.js
 *
 * Pricing:
 *   salePrice      = costPrice × 3          (shown strikethrough)
 *   discountAmount = costPrice × 1.5 - 60   (so displayed price = salePrice - discountAmount = costPrice × 1.5 + 60)
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ─── connection ──────────────────────────────────────────────────────────────
const DB_URI = process.env.DB_USERNAME
  ? `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@127.0.0.1:${process.env.DB_PORT || 27017}/${process.env.DB_NAME || 'shobaz'}?authSource=${process.env.AUTH_SOURCE || 'admin'}`
  : `mongodb://127.0.0.1:${process.env.DB_PORT || 27017}/${process.env.DB_NAME || 'shobaz'}`;

// ─── helpers ─────────────────────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function prices(costPrice) {
  const salePrice = costPrice * 3;
  const discountAmount = Math.round(costPrice * 1.5 - 60);
  return { costPrice, salePrice, discountAmount };
}

// ─── categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Productivity & Habits',           slug: 'productivity-habits' },
  { name: 'Finance & Wealth',                slug: 'finance-wealth' },
  { name: 'People Skills & Communication',   slug: 'people-skills-communication' },
  { name: 'Mindset & Psychology',            slug: 'mindset-psychology' },
  { name: 'Business & Entrepreneurship',     slug: 'business-entrepreneurship' },
  { name: 'Philosophy & Wisdom',             slug: 'philosophy-wisdom' },
  { name: 'Marketing & Leadership',          slug: 'marketing-leadership' },
];

// ─── books ───────────────────────────────────────────────────────────────────
const BOOKS = [
  // ── Category 1: Productivity & Habits ──
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'productivity-habits',
    pages: 208,
    costPrice: 138,
    description: `Master the science of habit formation with tiny, consistent changes that compound into remarkable results.\n\n• Learn the 4-step habit loop: cue, craving, response, reward\n• Discover how 1% improvements lead to 37× growth over a year\n• Practical techniques to build good habits and break bad ones\n• Ideal for anyone who wants to build lasting personal systems`,
  },
  {
    title: 'Deep Work',
    author: 'Cal Newport',
    category: 'productivity-habits',
    pages: 196,
    costPrice: 134,
    description: `Develop the ability to focus without distraction on cognitively demanding tasks — the skill that separates top performers from the rest.\n\n• Learn why deep work is becoming rare and increasingly valuable\n• Practical rules for scheduling, protecting, and training focus time\n• Strategies for draining the shallow and embracing the meaningful\n• Essential for knowledge workers, creators, and students`,
  },
  {
    title: 'The ONE Thing',
    author: 'Gary Keller & Jay Papasan',
    category: 'productivity-habits',
    pages: 236,
    costPrice: 149,
    description: `Achieve extraordinary results by narrowing your focus to the single most impactful action each day.\n\n• Debunks multitasking myths with research-backed clarity\n• Introduces the Focusing Question to cut through noise\n• Time-blocking strategies used by top entrepreneurs\n• Perfect for goal-setters who struggle with overwhelm`,
  },
  {
    title: 'Eat That Frog!',
    author: 'Brian Tracy',
    category: 'productivity-habits',
    pages: 212,
    costPrice: 140,
    description: `Stop procrastinating and get your most important tasks done first — every single day.\n\n• 21 powerful techniques to overcome procrastination instantly\n• Learn to identify and attack your biggest, most valuable tasks\n• Simple daily rituals that transform your output and income\n• A quick, actionable read for busy professionals`,
  },
  {
    title: 'Indistractable',
    author: 'Nir Eyal',
    category: 'productivity-habits',
    pages: 256,
    costPrice: 156,
    description: `Manage internal triggers and reclaim your time from the constant pull of distractions in a tech-driven world.\n\n• Understand why distraction starts from within, not from devices\n• Build a personal schedule based on your values, not notifications\n• Create pacts that make distraction harder than traction\n• Backed by behavioral psychology and real-world case studies`,
  },

  // ── Category 2: Finance & Wealth ──
  {
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    category: 'finance-wealth',
    pages: 196,
    costPrice: 134,
    description: `Understand how emotions, ego, and behavior shape financial decisions more than spreadsheets ever will.\n\n• 19 short stories on wealth, greed, and happiness\n• Why doing well with money has little to do with IQ\n• The power of reasonable over rational financial choices\n• Accessible and insightful for first-time investors and veterans alike`,
  },
  {
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    category: 'finance-wealth',
    pages: 216,
    costPrice: 141,
    description: `Challenge everything you were taught about money through the contrasting lessons of two father figures.\n\n• Assets vs. liabilities — the core distinction that changes your financial life\n• Why the rich don't work for money — they make money work for them\n• Introduction to financial literacy, investing, and passive income\n• The #1 personal finance book of all time`,
  },
  {
    title: 'The Intelligent Investor',
    author: 'Benjamin Graham',
    category: 'finance-wealth',
    pages: 660,
    costPrice: 308,
    description: `The definitive guide to value investing — Warren Buffett calls it "by far the best book on investing ever written."\n\n• Core principles of margin of safety and investor vs. speculator mindset\n• How to analyze stocks and bonds with discipline and patience\n• Strategies for defensive and enterprising investors\n• Timeless wisdom for anyone serious about long-term wealth`,
  },
  {
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    category: 'finance-wealth',
    pages: 332,
    costPrice: 185,
    description: `Distilled from interviews with 500 of the most successful people of the 20th century, this book reveals the 13 principles of wealth creation.\n\n• The power of desire, faith, and specialized knowledge\n• Mastermind groups, persistence, and the subconscious mind\n• A blueprint for turning ideas into financial success\n• One of the best-selling self-help books of all time`,
  },
  {
    title: 'I Will Teach You to Be Rich',
    author: 'Ramit Sethi',
    category: 'finance-wealth',
    pages: 444,
    costPrice: 227,
    description: `A no-BS, 6-week program to manage your money and start investing — written for millennials who want real results.\n\n• Automate savings, debt payoff, and investments in one system\n• Negotiate fees, optimize credit cards, and open the right accounts\n• Spend guilt-free on what you love by cutting what you don't\n• Practical, funny, and refreshingly honest about personal finance`,
  },

  // ── Category 3: People Skills & Communication ──
  {
    title: 'How to Win Friends and Influence People',
    author: 'Dale Carnegie',
    category: 'people-skills-communication',
    pages: 240,
    costPrice: 150,
    description: `The timeless guide to building genuine relationships and becoming someone people trust and want to follow.\n\n• Six ways to make people like you immediately\n• Twelve ways to win people to your way of thinking — without manipulation\n• How to handle complaints, criticism, and difficult conversations\n• Sold over 30 million copies; still the gold standard of people skills`,
  },
  {
    title: 'Never Split the Difference',
    author: 'Chris Voss',
    category: 'people-skills-communication',
    pages: 240,
    costPrice: 150,
    description: `Ex-FBI hostage negotiator Chris Voss reveals the counterintuitive tactics that work in high-stakes negotiations — and everyday life.\n\n• Tactical empathy, mirroring, and labeling emotions to build rapport\n• The "Accusation Audit" and the power of "No"\n• How to use calibrated questions to guide any conversation\n• Essential for sales, business deals, salary negotiations, and relationships`,
  },
  {
    title: 'Influence: The Psychology of Persuasion',
    author: 'Robert B. Cialdini',
    category: 'people-skills-communication',
    pages: 248,
    costPrice: 153,
    description: `Discover the six universal principles of influence and how to ethically apply — and defend against — them.\n\n• Reciprocity, commitment, social proof, authority, liking, scarcity\n• Real-world examples from sales, marketing, and everyday decisions\n• How to recognize when you're being influenced and how to push back\n• A must-read for marketers, negotiators, and communicators`,
  },
  {
    title: 'Crucial Conversations',
    author: 'Kerry Patterson et al.',
    category: 'people-skills-communication',
    pages: 316,
    costPrice: 176,
    description: `Navigate high-stakes conversations — those where emotions run strong and outcomes matter most — with confidence and skill.\n\n• Create a safe environment where dialogue flows freely\n• Master your stories: separate facts from emotionally-charged interpretations\n• Move from conflict to mutual understanding and clear action\n• Backed by 25 years of research with transformative real-world results`,
  },
  {
    title: 'The 48 Laws of Power',
    author: 'Robert Greene',
    category: 'people-skills-communication',
    pages: 624,
    costPrice: 294,
    description: `A ruthless and compelling guide to power dynamics drawn from centuries of historical figures — from Machiavelli to Louis XIV.\n\n• 48 laws distilled from history's greatest strategists, con artists, and kings\n• Understand how power works so you can navigate it on your own terms\n• Each law illustrated with vivid historical examples and a transgression story\n• Essential reading for leaders, diplomats, and ambitious professionals`,
  },

  // ── Category 4: Mindset & Psychology ──
  {
    title: 'Mindset',
    author: 'Carol S. Dweck',
    category: 'mindset-psychology',
    pages: 304,
    costPrice: 174,
    description: `Stanford psychologist Carol Dweck's groundbreaking research on how the beliefs we hold about our own abilities shape our entire lives.\n\n• Fixed vs. growth mindset — and how to shift between them\n• How mindset affects parenting, teaching, business, and relationships\n• Practical strategies to cultivate a growth mindset in yourself and others\n• Cited by educators, coaches, and CEOs worldwide`,
  },
  {
    title: "Man's Search for Meaning",
    author: 'Viktor E. Frankl',
    category: 'mindset-psychology',
    pages: 110,
    costPrice: 101,
    description: `Holocaust survivor Viktor Frankl's profound account of finding purpose even in the most extreme suffering — and the philosophy that emerged from it.\n\n• Chronicles life in Nazi concentration camps with raw emotional honesty\n• Introduces logotherapy: meaning as the primary motivator of human life\n• How purpose, love, and attitude transform even the worst circumstances\n• One of the most influential books of the 20th century`,
  },
  {
    title: "The Subtle Art of Not Giving a F*ck",
    author: 'Mark Manson',
    category: 'mindset-psychology',
    pages: 152,
    costPrice: 117,
    description: `A counterintuitive approach to living a good life — stop trying to be positive all the time and start choosing what actually matters.\n\n• Why chasing happiness makes you less happy — and what to do instead\n• Choose your struggles: success comes from what pain you're willing to endure\n• Values-based living over outcome-chasing\n• Honest, irreverent, and deeply practical`,
  },
  {
    title: "Can't Hurt Me",
    author: 'David Goggins',
    category: 'mindset-psychology',
    pages: 328,
    costPrice: 183,
    description: `David Goggins went from 300 lbs and broken to becoming one of the world's toughest endurance athletes — using sheer mental fortitude.\n\n• The "40% Rule" — your mind quits long before your body does\n• Accountability Mirror, Callousing the Mind, and the Cookie Jar method\n• Brutal honesty about failure, self-deception, and what real discipline looks like\n• For anyone who wants to unlock their maximum potential`,
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    category: 'mindset-psychology',
    pages: 568,
    costPrice: 273,
    description: `Nobel Prize-winning psychologist Daniel Kahneman reveals the two systems that drive the way we think — and why we're not as rational as we believe.\n\n• System 1 (fast, intuitive) vs. System 2 (slow, deliberate) thinking\n• Cognitive biases that distort our decisions in business, finance, and daily life\n• Anchoring, availability heuristics, overconfidence, and loss aversion explained\n• Groundbreaking, dense, and endlessly fascinating`,
  },

  // ── Category 5: Business & Entrepreneurship ──
  {
    title: 'Zero to One',
    author: 'Peter Thiel',
    category: 'business-entrepreneurship',
    pages: 164,
    costPrice: 122,
    description: `Peter Thiel's bold manifesto on building the future by creating companies that go from nothing to something entirely new.\n\n• Why competition is for losers and monopoly is the goal\n• The difference between vertical progress (0→1) and horizontal progress (1→n)\n• Secrets, sales, and the hidden foundations of startups\n• Required reading for founders, investors, and original thinkers`,
  },
  {
    title: '$100M Offers',
    author: 'Alex Hormozi',
    category: 'business-entrepreneurship',
    pages: 200,
    costPrice: 135,
    description: `Learn how to craft offers so compelling that prospects feel stupid saying no — and charge premium prices that reflect real value.\n\n• The "Grand Slam Offer" framework that generates millions\n• How to stack value, reduce risk, and eliminate price objections\n• Pricing psychology and why charging more can attract better clients\n• Practical and direct — written for entrepreneurs who want results fast`,
  },
  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    category: 'business-entrepreneurship',
    pages: 280,
    costPrice: 165,
    description: `A revolutionary approach to building and managing startups in an age of extreme uncertainty — validated by thousands of founders worldwide.\n\n• Build-Measure-Learn feedback loop for rapid iteration\n• Minimum Viable Product (MVP) and validated learning\n• When to pivot vs. persevere based on real data\n• The methodology behind some of the fastest-growing companies in the world`,
  },
  {
    title: 'Good to Great',
    author: 'Jim Collins',
    category: 'business-entrepreneurship',
    pages: 316,
    costPrice: 179,
    description: `A rigorous 5-year study of 11 companies that made the leap from good to great — and what separated them from those that didn't.\n\n• Level 5 Leadership: humility + fierce professional will\n• The Hedgehog Concept, the Flywheel, and the Stockdale Paradox\n• Why disciplined people, thought, and action beat charisma every time\n• Mandatory reading for CEOs, managers, and business students`,
  },
  {
    title: 'The Hard Thing About Hard Things',
    author: 'Ben Horowitz',
    category: 'business-entrepreneurship',
    pages: 260,
    costPrice: 158,
    description: `Ben Horowitz shares the brutal, unfiltered reality of building and leading a company when there are no easy answers.\n\n• How to handle layoffs, firings, and pivots without destroying morale\n• Wartime vs. peacetime CEO — and when to switch modes\n• Lessons from running Opsware through near-bankruptcy to a $1.6B acquisition\n• Raw, honest, and unlike any other business book you've read`,
  },

  // ── Category 6: Philosophy & Wisdom ──
  {
    title: 'Meditations',
    author: 'Marcus Aurelius',
    category: 'philosophy-wisdom',
    pages: 190,
    costPrice: 131,
    description: `Private journals of a Roman Emperor — never meant to be published — offering timeless Stoic wisdom on how to live and lead.\n\n• Control what you can, accept what you cannot — the Stoic core\n• Reflections on duty, impermanence, and inner freedom\n• How to remain grounded amid power, praise, and adversity\n• 2,000 years old and more relevant than ever`,
  },
  {
    title: 'The Obstacle Is the Way',
    author: 'Ryan Holiday',
    category: 'philosophy-wisdom',
    pages: 168,
    costPrice: 123,
    description: `Ryan Holiday distills Stoic philosophy into a modern guide: every obstacle you face is an opportunity to grow stronger.\n\n• Perception, action, and will — the three disciplines of Stoic practice\n• Historical stories from Marcus Aurelius, Lincoln, Edison, and others\n• How to turn setbacks, failures, and pressure into fuel\n• Short, powerful, and immediately applicable`,
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    category: 'philosophy-wisdom',
    pages: 124,
    costPrice: 107,
    description: `A magical fable about following your dreams and listening to the universe — one of the best-selling novels of all time.\n\n• Santiago's journey across the desert in pursuit of his "Personal Legend"\n• Themes of destiny, courage, love, and spiritual awakening\n• Simple prose packed with profound philosophical meaning\n• Translated into 80 languages; beloved by readers of all ages`,
  },
  {
    title: 'The 7 Habits of Highly Effective People',
    author: 'Stephen R. Covey',
    category: 'philosophy-wisdom',
    pages: 400,
    costPrice: 210,
    description: `A principle-centered framework for personal and professional effectiveness that has transformed millions of lives worldwide.\n\n• Be Proactive, Begin with the End in Mind, Put First Things First\n• Think Win-Win, Seek First to Understand, Synergize, Sharpen the Saw\n• The character ethic vs. the personality ethic\n• One of the most influential business books of the 20th century`,
  },
  {
    title: 'The Four Agreements',
    author: 'Don Miguel Ruiz',
    category: 'philosophy-wisdom',
    pages: 92,
    costPrice: 95,
    description: `Drawing from ancient Toltec wisdom, Don Miguel Ruiz offers four simple agreements that can transform your life and relationships.\n\n• Be Impeccable with Your Word\n• Don't Take Anything Personally\n• Don't Make Assumptions\n• Always Do Your Best\n\nA short but powerful guide to personal freedom and inner peace`,
  },

  // ── Category 7: Marketing & Leadership ──
  {
    title: 'Start with Why',
    author: 'Simon Sinek',
    category: 'marketing-leadership',
    pages: 272,
    costPrice: 162,
    description: `Simon Sinek reveals why some leaders and organizations inspire loyalty and action while others struggle — it starts with WHY.\n\n• The Golden Circle: Why → How → What\n• How Apple, Southwest, and Martin Luther King Jr. led with purpose\n• Why people don't buy what you do; they buy why you do it\n• Essential for entrepreneurs, marketers, and leaders building lasting brands`,
  },
  {
    title: 'This Is Marketing',
    author: 'Seth Godin',
    category: 'marketing-leadership',
    pages: 232,
    costPrice: 147,
    description: `Seth Godin reframes marketing as an act of service — finding the right people and making real change in their lives.\n\n• Serve the smallest viable audience, not the biggest possible market\n• Position your work around status, belonging, and tension\n• The difference between attention-grabbing tactics and genuine connection\n• Ideal for small businesses, creators, and anyone building a brand`,
  },
  {
    title: 'Contagious',
    author: 'Jonah Berger',
    category: 'marketing-leadership',
    pages: 204,
    costPrice: 137,
    description: `Wharton professor Jonah Berger reveals why some products, ideas, and behaviors spread virally — and how to engineer that effect.\n\n• STEPPS framework: Social Currency, Triggers, Emotion, Public, Practical Value, Stories\n• Why word-of-mouth outperforms advertising by a factor of 10\n• Real case studies from Blendtec, Livestrong, and $100 Cheesesteak\n• Practical for marketers, entrepreneurs, and anyone launching an idea`,
  },
  {
    title: 'Originals',
    author: 'Adam Grant',
    category: 'marketing-leadership',
    pages: 342,
    costPrice: 188,
    description: `Organizational psychologist Adam Grant explores how non-conformists move the world — and how anyone can champion new ideas.\n\n• Why the most successful people are strategic procrastinators, not first-movers\n• How to manage fear, build coalitions, and time your moment\n• Lessons from Warby Parker, suffragists, and Silicon Valley disruptors\n• Empowering for entrepreneurs, intrapreneurs, and creative professionals`,
  },
  {
    title: 'Drive',
    author: 'Daniel H. Pink',
    category: 'marketing-leadership',
    pages: 178,
    costPrice: 127,
    description: `Daniel Pink challenges the carrot-and-stick model of motivation and reveals what actually drives high performance in the modern workplace.\n\n• Autonomy, Mastery, and Purpose — the three pillars of intrinsic motivation\n• Why external rewards undermine creativity and long-term engagement\n• How businesses, schools, and leaders can redesign environments for deeper drive\n• Backed by four decades of social science research`,
  },
];

// ─── schemas (minimal) ───────────────────────────────────────────────────────
const ObjectId = mongoose.Schema.Types.ObjectId;

const CategorySchema = new mongoose.Schema({
  name:      { type: String, required: true },
  nameEn:    { type: String },
  slug:      { type: String, required: true, unique: true },
  status:    { type: String, default: 'publish' },
  readOnly:  { type: Boolean },
}, { versionKey: false, timestamps: true });

const AuthorSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  nameEn: { type: String },
  slug:   { type: String, required: true, unique: true },
}, { versionKey: false, timestamps: true });

const ProductSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  nameEn:         { type: String },
  slug:           { type: String, required: true, unique: true },
  description:    { type: String },
  shortDescription: { type: String },
  costPrice:      { type: Number },
  salePrice:      { type: Number },
  discountAmount: { type: Number },
  totalPages:     { type: Number },
  stock:          { type: Number },
  images:         [String],
  status:         { type: String, required: true },
  language:       { type: String },
  category: [{
    _id:    { type: ObjectId, ref: 'Category' },
    name:   String,
    nameEn: String,
    slug:   String,
  }],
  author: [{
    _id:    { type: ObjectId, ref: 'Author' },
    name:   String,
    nameEn: String,
    slug:   String,
  }],
}, { versionKey: false, timestamps: true });

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Connecting to', DB_URI);
  await mongoose.connect(DB_URI);
  console.log('Connected.\n');

  const Category = mongoose.model('Category', CategorySchema);
  const Author   = mongoose.model('Author',   AuthorSchema);
  const Product  = mongoose.model('Product',  ProductSchema);

  // 1. Upsert categories
  const catMap = {};
  let catCreated = 0, catFound = 0;
  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $setOnInsert: { name: c.name, nameEn: c.name, slug: c.slug, status: 'publish' } },
      { upsert: true, new: true },
    );
    catMap[c.slug] = doc;
    if (doc.createdAt && Date.now() - doc.createdAt < 5000) catCreated++;
    else catFound++;
  }
  console.log(`Categories: ${catCreated} created, ${catFound} already existed`);

  // 2. Collect unique authors, upsert
  const authorNames = [...new Set(BOOKS.map(b => b.author))];
  const authorMap = {};
  let authCreated = 0, authFound = 0;
  for (const name of authorNames) {
    const slug = toSlug(name);
    const doc = await Author.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, nameEn: name, slug } },
      { upsert: true, new: true },
    );
    authorMap[name] = doc;
    if (doc.createdAt && Date.now() - doc.createdAt < 5000) authCreated++;
    else authFound++;
  }
  console.log(`Authors:    ${authCreated} created, ${authFound} already existed`);

  // 3. Upsert products
  let prodCreated = 0, prodFound = 0;
  for (const book of BOOKS) {
    const slug = toSlug(book.title);
    const { costPrice, salePrice, discountAmount } = prices(book.costPrice);
    const cat = catMap[book.category];
    const aut = authorMap[book.author];

    const doc = await Product.findOneAndUpdate(
      { slug },
      {
        $set: {
          name:           book.title,
          nameEn:         book.title,
          slug,
          description:    book.description,
          shortDescription: book.description.split('\n')[0],
          costPrice,
          salePrice,
          discountAmount,
          totalPages:     book.pages,
          stock:          50,
          images:         [`/images/books/${slug}.jpg`],
          status:         'publish',
          language:       'English',
          category:       [{ _id: cat._id, name: cat.name, nameEn: cat.nameEn || cat.name, slug: cat.slug }],
          author:         [{ _id: aut._id, name: aut.name, nameEn: aut.nameEn || aut.name, slug: aut.slug }],
        },
      },
      { upsert: true, new: true },
    );

    const isNew = doc.createdAt && Date.now() - new Date(doc.createdAt).getTime() < 5000;
    if (isNew) prodCreated++; else prodFound++;
    console.log(`  [${isNew ? 'NEW' : 'UPD'}] ${book.title} | ৳${salePrice} → ৳${salePrice - discountAmount}`);
  }

  console.log(`\n──────────────────────────────────────────`);
  console.log(`Products:   ${prodCreated} created, ${prodFound} updated`);
  console.log(`Total books seeded: ${BOOKS.length}`);
  console.log(`──────────────────────────────────────────\n`);
  console.log('Done. Reminder: add real cover images to /public/images/books/[slug].jpg');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
