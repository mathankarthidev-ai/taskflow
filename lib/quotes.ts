export const DAY_QUOTES = [
  "Have a nice day!",
  "Wishing you a productive day ahead.",
  "Make today amazing.",
  "Every day is a fresh start.",
  "Stay positive and keep moving forward.",
  "Success starts with today's tasks.",
  "Let's make progress today.",
  "A great day begins with a great attitude.",
  "Keep shining and stay focused.",
  "Small steps lead to big achievements.",
  "Today is full of opportunities.",
  "Believe in yourself today.",
  "Start strong, finish stronger.",
  "Your effort today shapes tomorrow.",
  "Keep calm and get things done.",
  "Make today count.",
  "Stay motivated and keep growing.",
  "One task at a time, one success at a time.",
  "Good things happen when you stay consistent.",
  "Focus on progress, not perfection.",
  "Every accomplishment starts with a decision to try.",
  "Have a wonderful and productive day.",
  "Let's turn goals into achievements.",
  "Stay determined and keep pushing forward.",
  "Today is your chance to do something great.",
  "Work hard, stay humble.",
  "Keep your goals in sight.",
  "Success is built one task at a time.",
  "Welcome back! Let's achieve something amazing.",
  "A positive mindset creates positive results.",
  "Take on the day with confidence.",
  "Make every task a step toward success.",
  "Stay focused, stay unstoppable.",
  "Great things take time and effort.",
  "Your potential is limitless.",
  "Keep learning, keep improving.",
  "Every task completed is a victory.",
  "Welcome! Let's make today productive.",
  "Start the day with purpose.",
  "Stay inspired and keep creating.",
  "A little progress each day adds up.",
  "Today is another opportunity to excel.",
  "Keep your energy high and your goals higher.",
  "Success loves consistency.",
  "Be proud of how far you've come.",
  "The best time to start is now.",
  "Welcome to a brand-new day of possibilities.",
  "Stay organized, stay successful.",
  "Your hard work will pay off.",
  "Have an incredible day ahead! 🚀",
];

export function getTimeBasedGreeting(): { greeting: string; icon: string } {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return { greeting: "Happy Morning! ☀️", icon: "Have a wonderful day ahead!" };
  } else if (hour >= 12 && hour < 17) {
    return { greeting: "Happy Afternoon! 🌤️", icon: "Hope your day is going great!" };
  } else if (hour >= 17 && hour < 21) {
    return { greeting: "Happy Evening! 🌇", icon: "Hope you had a productive day!" };
  } else if (hour >= 21 && hour <= 23) {
    return { greeting: "Happy Night! 🌙", icon: "Time to relax and recharge!" };
  } else {
    return { greeting: "Still awake? 🌙", icon: "Don't forget to get some rest!" };
  }
}

export function getRandomQuote(): string {
  const index = Math.floor(Math.random() * DAY_QUOTES.length);
  return DAY_QUOTES[index];
}
