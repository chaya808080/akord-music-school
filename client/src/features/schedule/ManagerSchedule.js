import React from 'react'
import axios from "axios"
const ManagerSchedule = () => {
     const onLogin = () => {
        axios.get("https://localhost:7273/api/ReadAnnualHoursSystem").then(
            res => {
                var dd = res.data
                console.log(dd);
                //   dispatch(funcArrStudents(dd));
                // setarrStudents(dd);
                console.log(dd);
            }
        )
    }
    return (
        <div className='ManagerSchedule'>
            <button type="button" onClick={() => { onLogin(); }}>התחבר</button>
                            
               <h1>🎵ManagerSchedule🎵</h1>
           
        </div>
    )
}

export default ManagerSchedule