// Original USA ROM DATA_0FA800 message pointers; 24-column source rows retained.
export const PRACTICE_LESSONS=[
  {
    "id": 27,
    "address": "0FC251",
    "title": "Getting started",
    "text": "Hello! I'm Dr. Wright. You must be the new Mayor! Let's practice our city building techniques by building a Power Plant and then adding Residential, Commercial, and Industrial zones. Next, connect all zones with power and then add roads for the residents to travel on.",
    "rows": [
      "Hello! I*m Dr. Wright.  ",
      "You must be the new     ",
      "Mayor! Let*s practice   ",
      "our city building       ",
      "techniques by building a",
      "Power Plant and then    ",
      "adding Residential,     ",
      "Commercial, and         ",
      "Industrial zones. Next, ",
      "connect all zones with  ",
      "power and then add      ",
      "roads for the residents ",
      "to travel on."
    ]
  },
  {
    "id": 46,
    "address": "0FD45A",
    "title": "Reading demand",
    "text": "Do you know how to read this graph? If the bar is positive, there is a demand for that type of zone.The longer the bar, the greater the demand. Once you know how to use this graph, the feedback will help you to prevent unnecessary construction of zones.",
    "rows": [
      "Do you know how to read ",
      "this graph?  If the bar ",
      "is positive, there is a ",
      "demand for that type of ",
      "zone.The longer the bar,",
      "the greater the demand. ",
      "Once you know how to use",
      "this graph, the feedback",
      "will help you to prevent",
      "unnecessary construction",
      "of zones."
    ]
  },
  {
    "id": 50,
    "address": "0FD85F",
    "title": "Planning a budget",
    "text": "LET'S PLAN A BUDGET! It is important to form a budget every December. Careful planning is required to increase your revenue without upsetting the citizens. If they think the tax rate is high, they'll move to another city.",
    "rows": [
      "LET*S PLAN A BUDGET!    ",
      "                        ",
      "It is important to form ",
      "a budget every December.",
      "Careful planning is     ",
      "required to increase    ",
      "your revenue without    ",
      "upsetting the citizens. ",
      "If they think the tax   ",
      "rate is high, they*ll   ",
      "move to another city."
    ]
  },
  {
    "id": 28,
    "address": "0FC37F",
    "title": "City controls",
    "text": "Has your city been developing ok? Press to gain useful information about your city. Press to save your city. I'll come and help if you press . Start and Select moves to the icon bars.",
    "rows": [
      "Has your city been      ",
      "developing ok?  Press   ",
      "    to gain useful      ",
      "                        ",
      "information about your  ",
      "city. Press    to save  ",
      "                        ",
      "your city. I*ll come and",
      "help if you press    .  ",
      "                        ",
      "Start and Select moves  ",
      "to the icon bars."
    ]
  },
  {
    "id": 51,
    "address": "0FD965",
    "title": "Transport connections",
    "text": "Is everything going ok? To develop your city further, I think you should study your transportation network. Citizens don't like to live or work in an area that is difficult to get to. Connect each zone with roads or rail, but remember every kilometer requires maintenance.",
    "rows": [
      "Is everything going ok? ",
      "To develop your city    ",
      "further, I think you    ",
      "should study your       ",
      "transportation network. ",
      "Citizens don*t like to  ",
      "live or work in an area ",
      "that is difficult to get",
      "to.  Connect each zone  ",
      "with roads or rail, but ",
      "remember every kilometer",
      "requires maintenance."
    ]
  },
  {
    "id": 38,
    "address": "0FCD87",
    "title": "Practice complete",
    "text": "Congratulations on achieving a city with a population of 30,000 people! It seems like your city planning has been pretty successful. You are a great Mayor now! Why don't you plan to build an even bigger city?",
    "rows": [
      "Congratulations on      ",
      "achieving a city with a ",
      "population of 30,000    ",
      "people!  It seems like  ",
      "your city planning has  ",
      "been pretty successful. ",
      "You are a great Mayor   ",
      "now!  Why don*t you plan",
      "to build an even bigger ",
      "city?"
    ]
  },
  {
    "id": 39,
    "address": "0FCE65",
    "title": "Practice review",
    "text": "I'm sorry, but it seems like something wasn't quite right in your city planning. Was your budget balanced properly? Did you solve your traffic and crime problems? Did you build a stadium? Let's think about this some more and try again.",
    "rows": [
      "I*m sorry, but it seems ",
      "like something wasn*t   ",
      "quite right in your     ",
      "city planning. Was your ",
      "budget balanced         ",
      "properly? Did you solve ",
      "your traffic and crime  ",
      "problems?  Did you      ",
      "build a stadium?  Let*s ",
      "think about this some   ",
      "more and try again."
    ]
  }
];
export function practiceNotice(id){const lesson=PRACTICE_LESSONS.find(l=>l.id===id);return lesson?'Practice: '+lesson.title+'. Read the lesson in Information.':'';}
