// src/lib/academy.ts

export const academy = {
  name: "Dumka Sports Academy",
  tagline: "Empowering athletes to achieve peak performance, discipline, and competitive excellence.",
  about:
    "Dumka Sports Academy is dedicated to developing world-class athletes across multiple sports disciplines. We blend elite coaching, modern performance tracking, and clear pathways to competitive trials, helping every player realize their full athletic potential.",
  contact: {
    address: "Dumka, Jharkhand 814101",
    phone: "+1 (555) 019-2834",
    phoneHref: "tel:+15550192834",
    email: "desk@dumkasportsacademy.com",
    emailHref: "mailto:desk@dumkasportsacademy.com",
    workingHours: "Monday – Saturday: 6:00 AM – 9:00 PM (Closed Sundays)",
  },
  sections: {
    heroLoginCta: "Login",
    heroSportsCta: "Our sports",
    navLogin: "Login",
    sportsHeading: "Sports we offer",
    sportsEmptyState: "Sports will be listed soon.",
    howItWorksHeading: "One place for the whole academy",
    howItWorksCards: [
      {
        id: "players",
        title: "Players",
        description: "See your own attendance, match stats and trial readiness.",
      },
      {
        id: "coaches",
        title: "Coaches",
        description: "Mark attendance, record matches and see who is ready.",
      },
      {
        id: "scouts",
        title: "Scouts",
        description: "View players who meet the trial criteria.",
      },
    ],
    aboutHeading: "About and contact",
    contactHeading: "Contact information",
    hoursLabel: "Working hours",
    phoneLabel: "Phone",
    emailLabel: "Email",
    addressLabel: "Address",
  },
  footer: {
    copyrightSuffix: "All rights reserved.",
  },
} as const;

export default academy;
