'use client'

import { useState } from 'react'
import More from './ui/more'
import Student from './ui/student'

const mondayOf = d => {
    const dd = new Date(d)
    const shift = (dd.getDay() + 6) % 7      // Mon = 0 … Sun = 6
    dd.setDate(dd.getDate() - shift)
    dd.setHours(0, 0, 0, 0)
    return dd
}

export default function CourseTryMain({ data, book, student, teacher, area }) {
    const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', minHeight: 0 }}>
            <More
                data={data}
                weekStart={weekStart}
                setWeekStart={setWeekStart}
                book={book}
                student={student}
                teacher={teacher}
                area={area}
            />

            <Student
                data={data}
                book={book}
                student={student}
                teacher={teacher}
                area={area}
            />
        </div>
    )
}
