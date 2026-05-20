import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (!firebaseUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", firebaseUser.uid);
      unsubDoc = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          setUserData({
            fullName: firebaseUser.displayName || "Scholar",
            email: firebaseUser.email,
            level: "A1",
            coins: 0,
            streak: 0,
            wordsLearned: 0,
            daysWorked: 0,
            totalStudyTime: 0,
          });
        }
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, userData, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}