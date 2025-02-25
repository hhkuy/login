/**** 1) استيراد مكتبات Firebase اللازمة ****/
import { 
  initializeApp 
} from "firebase/app";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  child
} from "firebase/database";

/**** 2) معلومات مشروع Firebase الخاصة بك ****/
const firebaseConfig = {
  apiKey: "AIzaSyAAp1KkuFVqB5D8v_m4dJ4snEbCTjv7R8U",
  authDomain: "sums-site.firebaseapp.com",
  databaseURL: "https://sums-site-default-rtdb.firebaseio.com",
  projectId: "sums-site",
  storageBucket: "sums-site.firebasestorage.app",
  messagingSenderId: "154631517392",
  appId: "1:154631517392:web:185e081d1ee6e722451ad5"
};

/**** 3) تهيئة تطبيق Firebase ****/
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/**** 4) المراجع إلى عناصر الصفحة ****/
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const statusDiv = document.getElementById("status");
const errorDiv = document.getElementById("error");

/**** 5) دوال مساعدة لعرض الرسائل ****/
function showStatus(message) {
  statusDiv.textContent = message;
}

function showError(message) {
  errorDiv.textContent = message;
}

/**** 6) دالة لإنشاء حساب جديد ****/
async function signUp() {
  const email = emailInput.value;
  const password = passwordInput.value;

  // تفريغ رسائل الحالة أو الخطأ
  showStatus("");
  showError("");

  try {
    // إنشاء حساب جديد في Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // عند الإنشاء الناجح، قم بحفظ حالة "loggedIn" في Realtime Database على false
    // بحيث لا يكون المستخدم مسجلاً للدخول فور الإنشاء
    const userRef = ref(db, `users/${user.uid}`);
    await set(userRef, {
      loggedIn: false,
      email: user.email
    });

    showStatus("تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.");
  } catch (error) {
    showError(`فشل إنشاء الحساب: ${error.message}`);
  }
}

/**** 7) دالة لتسجيل الدخول مع التحقق من عدم تسجيل الدخول على جهاز آخر ****/
async function logIn() {
  const email = emailInput.value;
  const password = passwordInput.value;

  // تفريغ رسائل الحالة أو الخطأ
  showStatus("");
  showError("");

  try {
    // تسجيل الدخول عبر Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userRef = ref(db, `users/${user.uid}`);

    // جلب بيانات المستخدم من Realtime Database
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();

      // إذا كان المستخدم مسجلاً للدخول (loggedIn = true) بالفعل في قاعدة البيانات،
      // فهذا يعني أنه يحاول تسجيل الدخول من جهاز آخر
      if (userData.loggedIn === true) {
        // تسجيل الخروج مباشرة
        await signOut(auth);

        showError("لا يمكنك تسجيل الدخول من جهاز آخر ما لم تقم بتسجيل الخروج أولاً.");
      } else {
        // إذا لم يكن مسجلاً للدخول، نحدّث الحالة إلى true
        await update(userRef, {
          loggedIn: true
        });
        showStatus("تم تسجيل الدخول بنجاح!");
      }
    } else {
      // في حال لم توجد بيانات (حالة نادرة إذا لم يتم إنشاء المستخدم بشكل صحيح)
      showError("حدث خطأ في البيانات. جرّب مرة أخرى.");
    }
  } catch (error) {
    showError(`فشل تسجيل الدخول: ${error.message}`);
  }
}

/**** 8) دالة لتسجيل الخروج ****/
async function logOut() {
  // تفريغ رسائل الحالة أو الخطأ
  showStatus("");
  showError("");

  // إذا كان هناك مستخدم حالياً
  if (auth.currentUser) {
    const user = auth.currentUser;
    const userRef = ref(db, `users/${user.uid}`);

    try {
      // تحدّث حالة المستخدم في قاعدة البيانات إلى false
      await update(userRef, {
        loggedIn: false
      });

      // ثم تسجيل الخروج من Firebase Auth
      await signOut(auth);
      showStatus("تم تسجيل الخروج بنجاح!");
    } catch (error) {
      showError(`فشل تسجيل الخروج: ${error.message}`);
    }
  } else {
    showError("لا يوجد مستخدم مسجل الدخول حالياً.");
  }
}

/**** 9) الاستماع لتغير حالة المصادقة (Auth State) ****/
onAuthStateChanged(auth, (user) => {
  if (user) {
    // يوجد مستخدم مسجل دخول
    showStatus(`مستخدم مسجل الدخول: ${user.email}`);
  } else {
    // لا يوجد مستخدم مسجل الدخول
    showStatus("لا يوجد مستخدم مسجل الدخول حالياً.");
  }
});

/**** 10) ربط الأزرار بالدوال ****/
signupBtn.addEventListener("click", signUp);
loginBtn.addEventListener("click", logIn);
logoutBtn.addEventListener("click", logOut);
