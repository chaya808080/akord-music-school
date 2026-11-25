
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    arrStudents: []
}
const StudentsSlice = createSlice({
    name: "StudentsSlice",
    initialState,
    reducers: {

        funcArrStudents: (state, action) => {

            const newUser = action.payload;
            state.arrStudents.push(...newUser)
            // console.log(state.arrStudents);

        }
    }
})
export const { funcArrStudents } = StudentsSlice.actions;
export default StudentsSlice.reducer;
