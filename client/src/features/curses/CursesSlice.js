
 import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    arrCourses: []
}
 const CursesSlice = createSlice({
     name: "CursesSlice",
initialState,
     reducers: {
  funcArrCourses: (state, action) => {

            const newCoures= action.payload;
            state.arrCourses.push(...newCoures)

        }
    }

 })

 export const {funcArrCourses} = CursesSlice.actions;
 export default CursesSlice.reducer;