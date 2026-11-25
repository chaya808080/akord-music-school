import React from 'react'
import AddTeachers from './AddTeachers'
import TeachersActiveTable from './TeachersActiveTable'
import TeachersPauseTable from './TeachersPauseTable'
import axios from "axios"
import { funcArrTeachers } from './TeachersSlice'
import { useSelector, useDispatch } from 'react-redux'

const ManagerTeachers = () => {
    //  const dispatch = useDispatch();
    // const arrStudents = useSelector(state => state.StudentsSlice.arrStudents)
    // const onLogin = () => {
    //     axios.get("https://localhost:7273/api/ReadTeachers").then(
    //         res => {
    //             var dd = res.data
    //             if (dd != null)
    //                 dispatch(funcArrTeachers(dd));
    //         }
    //     )
    // }
    return (
        <div className='ManagerTeachers'>
            
           <h1>🎵ManagerTeachers🎵</h1>
           <AddTeachers></AddTeachers>
           <TeachersActiveTable></TeachersActiveTable>
           <TeachersPauseTable></TeachersPauseTable>
        </div>
    )
}

export default ManagerTeachers