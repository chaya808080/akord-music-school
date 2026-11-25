import React from 'react'
import axios from "axios"
import { funcArrCourses } from './CursesSlice'
import { useSelector, useDispatch } from 'react-redux'
import AddCours from './AddCours'

const ManagerCurses = () => {
    const dispatch = useDispatch();
        const arrCourses = useSelector(state => state.CursesSlice.arrCourses)

     const onLogin = () => {
        axios.get("https://localhost:7273/api/ReadCourses").then(
            res => {
                console.log("hhhhhhhhhhhhhhhh");
                var dd = res.data
                console.log(dd);
                  dispatch(funcArrCourses(dd));
                
                
            }
        )
    }
    return (
        <div className='ManagerCurses'>
            <AddCours></AddCours>
           <button type="button" onClick={() => { onLogin(); }}>התחבר</button>                              
               <h1>🎵ManagerCurses🎵</h1>
           <div style={{ display: 'flex' }}>
                <table class="table-bordered">
                    <thead>
                        <tr id="tt">
                            <th>קוד קורס</th>                          
                            <th>שם הקורס</th>
                            <th>מין</th>
                            <th>מחיר</th>
                            <th>תיאור</th>
                            <th>משך זמן הקורס</th>
                            <th>מגיל</th>
                            <th>עד גיל</th>                           
                        </tr>
                    </thead>
                    {arrCourses.map(r =>
                        <tbody>
                            <tr>
                                <th>{r.codeOfCourse}</th>                              
                                <th>{r.nameOfCourse}</th>
                                <th>{r.sexOfCourse}</th>
                                <th>{r.priceOfCourse}</th>
                                <th>{r.descriptionOfCourse}</th>
                                <th>{r.duretionTimeOfCourse}</th>
                                <th>{r.fromAge}</th>
                                <th>{r.toAge}</th>

                            </tr>
                        </tbody>
                    )}    </table>

            </div>
        </div>
    )
}

export default ManagerCurses
