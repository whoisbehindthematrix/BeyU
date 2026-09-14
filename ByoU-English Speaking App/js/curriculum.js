function day(n, title, questions, phrases = []) {
  return { day: n, title, questions, phrases };
}

function week(num, title, days) {
  return { week: num, title, days };
}

export const interviewWeeks = [
  week(1, "Introduce yourself with confidence", [
    day(1, "Tell me about yourself", ["Tell me about yourself.", "What did you study?", "Where did you grow up, and what is one thing people know you for?"], ["I'm ___. I completed ___ in ___.", "I studied ___ at ___."]),
    day(2, "Your education story", ["Why did you choose that course?", "What did you enjoy most in your studies?", "Would you choose the same course again? Why?"], ["I chose ___ because ___.", "The part I enjoyed most was ___."]),
    day(3, "Your skills", ["What are you good at?", "Give me an example of using that skill.", "How did you get better at that skill?"], ["I'm good at ___.", "For example, once I ___."]),
    day(4, "Your goal", ["What kind of job are you looking for?", "Why this field?", "Where do you see yourself in two years?"], ["I'm looking for a role in ___.", "This field suits me because ___."]),
    day(5, "Your work or training", ["Tell me about your last project or training.", "What was your responsibility?", "What did you learn from that project or training?"], ["In my training, I worked on ___.", "I was responsible for ___."]),
    day(6, "Your 60-second introduction", ["Introduce yourself in one minute.", "What makes you a good hire?", "Why should we hire you, in two sentences?"], ["To introduce myself, ___.", "In short, I can ___."]),
    day(7, "Week 1 review — mini mock", ["Tell me about yourself.", "What are you good at?", "Why this field?"], ["Review: name, study, one strength."]),
  ]),
  week(2, "Talk about your work", [
    day(8, "A typical work day", ["Walk me through a normal day at work or college.", "What part of the day is hardest, and why?", "Who do you work with most, and how do you help each other?"], ["Usually my day starts with ___.", "The hardest part is ___."]),
    day(9, "A project you owned", ["Tell me about a project you owned from start to finish.", "What was the goal of that project?", "What would you do differently next time?"], ["I owned a project where ___.", "The goal was ___."]),
    day(10, "Working with a team", ["Tell me about a time you worked in a team.", "What was your role in that team?", "How did you handle a disagreement?"], ["In my team I was responsible for ___.", "When we disagreed, I ___."]),
    day(11, "A tight deadline", ["Tell me about a time the deadline was very tight.", "What did you do first?", "How did it end?"], ["The deadline was tight, so I ___.", "In the end, we ___."]),
    day(12, "Tools and process", ["What tools do you use in your work or studies?", "How do you keep track of tasks?", "How do you make sure work is accurate?"], ["I usually use ___ to ___.", "To stay organised I ___."]),
    day(13, "What you learned", ["What is the most useful thing you learned at work or in training?", "Who taught you that?", "How do you use it now?"], ["The most useful thing I learned was ___.", "I use it when I ___."]),
    day(14, "Week 2 review — mini mock", ["Walk me through a project you are proud of.", "What was your responsibility?", "What did you learn from working with others?"], ["I am proud of a project where ___."]),
  ]),
  week(3, "The classic questions", [
    day(15, "Your strengths", ["What is your biggest strength?", "Give me one example of that strength at work or college.", "How would a teammate describe you?"], ["My biggest strength is ___.", "For example, once I ___."]),
    day(16, "A weakness you are improving", ["What is one thing you are trying to improve?", "What are you doing to get better?", "How will you know you have improved?"], ["I am working on ___.", "To get better I ___."]),
    day(17, "Why this company", ["Why do you want to work with us?", "What do you know about this role?", "What would you like to learn here in the first three months?"], ["I want to work here because ___.", "In the first three months I hope to ___."]),
    day(18, "A mistake you learned from", ["Tell me about a mistake you made.", "What did you do after you noticed it?", "What changed in how you work after that?"], ["I once made a mistake when ___.", "After that I started to ___."]),
    day(19, "Five years from now", ["Where do you see yourself in five years?", "What skill do you want to be known for?", "What kind of team do you want to work in?"], ["In five years I hope to ___.", "I want to be known for ___."]),
    day(20, "Notice period and joining", ["When can you join if we make an offer?", "Are you interviewing anywhere else?", "What questions do you have for me?"], ["I can join in ___.", "One question I have is ___."]),
    day(21, "Week 3 review — mini mock", ["What is your biggest strength?", "Why this role?", "Tell me about a mistake you learned from."], ["My biggest strength is ___."]),
  ]),
  week(4, "Pressure-proof", [
    day(22, "An unexpected question", ["Tell me something that is not on your resume.", "What do you do to stay calm under pressure?", "If you had a free afternoon, how would you spend it?"], ["One thing people don't see on my resume is ___.", "When I feel pressure I ___."]),
    day(23, "Disagreeing politely", ["Tell me about a time you disagreed with a teacher, manager, or teammate.", "How did you say it without making it personal?", "What happened after that?"], ["I disagreed when ___.", "I said it by ___."]),
    day(24, "Feedback and criticism", ["Tell me about a time someone criticised your work.", "What did you do with that feedback?", "What did you change the next time?"], ["Someone once told me ___.", "I used that to ___."]),
    day(25, "Two offers", ["If you had two job offers, how would you choose?", "What matters more to you: learning or salary, and why?", "What would make you stay in a job for two years?"], ["I would choose based on ___.", "I would stay if ___."]),
    day(26, "A gap or a slow start", ["Have you ever had a gap in studies or work? What did you do then?", "How do you explain a slow start on a new task?", "What helps you learn a new job faster?"], ["During that time I ___.", "To learn faster I ___."]),
    day(27, "Why you, not someone else", ["Why should we hire you and not the next person?", "What can you start helping with in week one?", "What is one promise you can keep if we hire you?"], ["You should hire me because ___.", "In week one I can ___."]),
    day(28, "Mock round — yourself", ["Tell me about yourself in 45 seconds.", "What are you good at?", "Why this field?"], ["To introduce myself, ___."]),
    day(29, "Mock round — a story", ["Tell me about a challenge you overcame.", "What did you do, step by step?", "What was the result?"], ["The challenge was ___.", "I did ___, and the result was ___."]),
    day(30, "Final mock", ["Introduce yourself.", "Tell me about a project you owned.", "Why should we hire you, in two sentences?"], ["In short, I can ___."]),
  ]),
];

export const conversationWeeks = [
  week(1, "Everyday small talk", [
    day(1, "Greetings that go further", ["How are you doing today, really?", "How was your morning?", "What has been the best part of your week so far?"], ["Honestly, today has been ___.", "My morning was ___ because ___."]),
    day(2, "Your weekend", ["What did you do this weekend?", "What was the best part?", "What will you do next weekend?"], ["This weekend I ___.", "The best part was ___."]),
    day(3, "Your daily routine", ["Walk me through your normal day.", "What part of the day do you like most?", "What do you do after work or college?"], ["Usually I start my day with ___.", "After that, I ___."]),
    day(4, "Small talk starters", ["How's the weather there today?", "How do you travel to work or college?", "How long does your commute take?"], ["It's quite ___ today.", "I usually take the ___."]),
    day(5, "Food you love", ["What's your favourite food?", "How is it made?", "When do you usually eat it, and who with?"], ["My favourite food is ___.", "First you ___, then you ___."]),
    day(6, "Your city", ["Tell me about your city or neighbourhood.", "What should a visitor see?", "Where do you go often nearby?"], ["I live in ___, which is known for ___.", "You should definitely visit ___."]),
    day(7, "Free talk Friday", ["Pick any topic and talk for one minute.", "Tell me about something you learned this week.", "What are you looking forward to?"], ["Let me tell you about ___."]),
  ]),
  week(2, "Plans & stories", [
    day(8, "This week's plans", ["What are your plans for this week?", "What is one thing you must finish?", "What are you looking forward to?"], ["This week I plan to ___.", "I must finish ___."]),
    day(9, "A childhood story", ["Tell me a small story from your childhood.", "Who was with you?", "Why do you still remember it?"], ["When I was younger, ___.", "I still remember it because ___."]),
    day(10, "A time you helped someone", ["Tell me about a time you helped someone.", "What did they need?", "How did it feel afterwards?"], ["I helped someone when ___.", "They needed ___."]),
    day(11, "A trip you want", ["If you could travel anywhere next year, where would you go?", "Who would you take with you?", "What would you do on the first day?"], ["I would go to ___.", "On the first day I would ___."]),
    day(12, "A funny mistake", ["Tell me about a funny mistake you made.", "What happened next?", "Do you laugh about it now?"], ["I once made a funny mistake when ___.", "Now I laugh because ___."]),
    day(13, "Your people", ["Who do you spend most evenings with?", "Tell me about one person who matters to you.", "What do you usually talk about?"], ["I usually spend evenings with ___.", "They matter to me because ___."]),
    day(14, "Week 2 review — a story", ["Tell me about last weekend as a short story.", "What was the best moment?", "What will you do differently next weekend?"], ["Last weekend I ___.", "The best moment was ___."]),
  ]),
  week(3, "Opinions & reactions", [
    day(15, "Phone vs meeting people", ["Do you prefer chatting on the phone or meeting in person? Why?", "When is a message better than a call?", "How do you start a conversation with someone new?"], ["I prefer ___ because ___.", "A message is better when ___."]),
    day(16, "Working from home", ["Would you rather work from home or go to an office? Why?", "What is hard about each option?", "How do you stay focused?"], ["I would rather ___ because ___.", "To stay focused I ___."]),
    day(17, "An app you use", ["What app do you use every day, and why?", "How does it help you?", "What is one thing you wish it did better?"], ["I use ___ every day because ___.", "I wish it could ___."]),
    day(18, "Something you heard", ["Tell me about a piece of news or a story that interested you this week.", "Why did it catch your attention?", "What is your opinion on it?"], ["I heard about ___.", "I think ___."]),
    day(19, "Advice for a friend", ["A friend is nervous about speaking English. What would you tell them?", "What helped you personally?", "What should they practise first?"], ["I would tell them ___.", "They should start with ___."]),
    day(20, "Your city, your view", ["If you could change one thing in your city, what would it be?", "Who would it help?", "What small thing could people do this week?"], ["I would change ___.", "It would help ___."]),
    day(21, "Week 3 review — your take", ["Give your opinion on working from home.", "Tell me about an app you like.", "What advice would you give a nervous speaker?"], ["In my view, ___."]),
  ]),
  week(4, "Real-world situations", [
    day(22, "In a shop", ["You cannot find something in a shop. What do you say to the staff?", "They show you the wrong item. What do you say?", "How do you thank them and leave?"], ["Excuse me, could you help me find ___?", "I was looking for ___."]),
    day(23, "A polite complaint", ["Your food order is wrong. What do you say?", "They offer to fix it. How do you reply?", "How do you keep it calm and clear?"], ["Sorry, I ordered ___, but I received ___.", "Thank you, that would help."]),
    day(24, "Calling a clinic", ["You need to book an appointment. What do you say first?", "They ask what the problem is. How do you explain it simply?", "How do you confirm the day and time?"], ["Hello, I would like to book an appointment.", "I am free on ___ at ___."]),
    day(25, "Meeting someone new", ["You are at a gathering and you know nobody. How do you start talking?", "They ask what you do. How do you answer in one sentence?", "How do you end the chat politely?"], ["Hi, I don't think we have met. I'm ___.", "It was nice talking to you."]),
    day(26, "Giving directions", ["Someone asks how to reach the station from your area. What do you say?", "What landmark would you mention?", "How do you check they understood?"], ["Go straight till you see ___, then ___.", "Does that make sense?"]),
    day(27, "Talking about money", ["A friend asks to split a bill. What do you say?", "The amount looks high. How do you ask, politely?", "How do you settle it?"], ["Shall we split it?", "Could you show me the amount once?"]),
    day(28, "Small talk at work", ["A colleague asks about your weekend. What do you say?", "They look busy. How do you keep it short?", "How do you ask how they are doing?"], ["My weekend was ___. How was yours?", "I'll let you get back to it."]),
    day(29, "A misunderstanding", ["Someone misunderstood what you said. How do you clear it up?", "What do you say if it was your mistake?", "How do you move the conversation forward?"], ["Sorry, what I meant was ___.", "Thanks for checking — let's ___."]),
    day(30, "Final free talk", ["Pick a real situation from this week and talk for one minute.", "What did you say, and what do you wish you had said?", "What will you try next time?"], ["This week I had to ___.", "Next time I will say ___."]),
  ]),
];

function remap(src, n) {
  return { ...src, day: n };
}

export const combinedWeeks = [
  week(1, "The complete path — Week 1", [
    remap(interviewWeeks[0].days[0], 1),
    remap(interviewWeeks[0].days[1], 2),
    remap(interviewWeeks[0].days[2], 3),
    remap(interviewWeeks[0].days[3], 4),
    remap(conversationWeeks[0].days[1], 5),
    remap(conversationWeeks[0].days[2], 6),
    day(7, "Mixed review — mini mock", ["Tell me about yourself.", "What did you do this weekend?", "What are you good at?"], ["Review: name, study, one weekend detail."]),
  ]),
  week(2, "The complete path — Week 2", [
    remap(interviewWeeks[1].days[0], 8),
    remap(interviewWeeks[1].days[1], 9),
    remap(conversationWeeks[1].days[0], 10),
    remap(interviewWeeks[1].days[2], 11),
    remap(conversationWeeks[1].days[3], 12),
    remap(interviewWeeks[1].days[3], 13),
    day(14, "Mixed review — work and stories", ["Walk me through a project you owned.", "What did you do last weekend?", "What did you learn from working with others?"], ["I am proud of a project where ___."]),
  ]),
  week(3, "The complete path — Week 3", [
    remap(interviewWeeks[2].days[0], 15),
    remap(interviewWeeks[2].days[1], 16),
    remap(conversationWeeks[2].days[0], 17),
    remap(interviewWeeks[2].days[2], 18),
    remap(conversationWeeks[2].days[4], 19),
    remap(interviewWeeks[2].days[3], 20),
    day(21, "Mixed review — opinions and classics", ["What is your biggest strength?", "Would you rather work from home or go to an office?", "Tell me about a mistake you learned from."], ["My biggest strength is ___."]),
  ]),
  week(4, "The complete path — Week 4", [
    remap(interviewWeeks[3].days[0], 22),
    remap(conversationWeeks[3].days[0], 23),
    remap(interviewWeeks[3].days[1], 24),
    remap(conversationWeeks[3].days[2], 25),
    remap(interviewWeeks[3].days[5], 26),
    remap(conversationWeeks[3].days[7], 27),
    remap(interviewWeeks[3].days[6], 28),
    remap(conversationWeeks[3].days[8], 29),
    day(30, "Final mixed mock", ["Introduce yourself.", "Tell me about a real situation from this week.", "Why should we hire you, in two sentences?"], ["In short, I can ___."]),
  ]),
];
