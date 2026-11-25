import { configureStore } from "@reduxjs/toolkit";
// import studentsReducer from '../features/students/MnagerStudents';
//  import cursesReducer from '../features/curses/ManagerCurses';
// import teachersReducer from '../features/teachers/ManagerTeachers';
// import scheduleReducer from '../features/schedule/ManagerSchedule';
// import paymentsReducer from '../features/payments/ManagerPayments';
// import StudentsSlice from '../features/students/StudentsSlice'
// import TeachersSlice from '../features/teachers/TeachersSlice'
import StudentsSlice from '../features/students/StudentsSlice'
import CursesSlice from '../features/curses/CursesSlice'
export const store = configureStore(
    {
    reducer: {     
           //ScheduleSlice:ScheduleSlice       
            StudentsSlice:StudentsSlice,
            CursesSlice:CursesSlice
            // TeachersSlice:TeachersSlice
            // curses:cursesReducer,
            // teachers:teachersReducer,
            // schedule:scheduleReducer,
            // payments:paymentsReducer,
    }
}
)