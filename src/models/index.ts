// src/models/index.ts
import User from "./User";
import Sport from "./Sport";
import Player from "./Player";
import Session from "./Session";
import Attendance from "./Attendance";
import Match from "./Match";
import MatchScore from "./MatchScore";

// Export all models so importing '@/models' guarantees schema registration
export { User, Sport, Player, Session, Attendance, Match, MatchScore };
