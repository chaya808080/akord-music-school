import AddStudent from './AddStudent'
import axios from "axios"
import { funcArrStudents } from './StudentsSlice'
import { useSelector, useDispatch } from 'react-redux'
import { useState } from 'react'
const MnagerStudents = () => {
    const dispatch = useDispatch();
    const arrStudents = useSelector(state => state.StudentsSlice.arrStudents)
    const onLogin = () => {
        axios.get("https://localhost:7273/api/ReadStudents").then(
            res => {
                var dd = res.data
                if (dd != null)
                    dispatch(funcArrStudents(dd));
            }
        )
    }

    return (
        <div className='MnagerStudents'>
            <h1>🎵MnagerStudents🎵</h1>
            <button type="button" onClick={() => { onLogin(); }}>התחבר</button>
            <div style={{ display: 'flex' }}>
                <table class="table-bordered">
                    <thead>
                        <tr id="tt">
                            <th>קוד תלמיד</th>
                            <th>ת.ז  </th>
                            <th>קוד משפחה </th>
                            <th>שם  </th>
                            <th> תאריך לידה  </th>
                            <th>תאריך התחלה </th>
                            <th>כמות שיעורים בפועל </th>
                            <th>כמות שיעורים להשלמה  </th>
                            <th>פעיל /גמר/מחכה  </th>
                            <th> הערות </th>
                            <th>ק.ח</th>
                        </tr>
                    </thead>
                    {arrStudents.map(r =>
                        <tbody>
                            <tr>
                                <th>{r.codeOfStudent}</th>
                                <th>{r.idOfStudents}</th>
                                <th>{r.codeFamily}</th>
                                <th>{r.firstName}</th>
                                <th>{r.birsDate}</th>
                                <th>{r.beginDate}</th>
                                <th>{r.countLessonAct}</th>
                                <th>{r.fixLesson}</th>
                                <th>{r.actOrWaitOrFinish}</th>
                                <th>{r.finishDate}</th>
                                <th>{r.coments}</th>
                                {/* <th>{r.k.ch}</th> */}
                            </tr>
                        </tbody>
                    )}    </table>

            </div>
        </div >
    )
}
export default MnagerStudents