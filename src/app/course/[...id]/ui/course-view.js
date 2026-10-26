'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Timeline from './timeline';
import Detail from './detailcourse';

export default function CourseView({ data, params, initialLessonId, students, users }) {
    const router = useRouter();
    const [activeLessonId, setActiveLessonId] = useState(initialLessonId);

    useEffect(() => {
        setActiveLessonId(initialLessonId);
    }, [initialLessonId]);

    const courseCode = data?.ID || params?.[0] || '';

    const handleSelectLesson = useCallback((lessonId, lessonIndex) => {
        setActiveLessonId(lessonId);
        if (typeof window !== 'undefined') {
            if (lessonId && lessonIndex) {
                router.replace(`/course/${courseCode}?lesson=${lessonIndex}`, { scroll: false });
            } else if (lessonId) {
                const foundIdx = (data?.Detail || []).findIndex(d => String(d._id) === String(lessonId));
                const idx = foundIdx >= 0 ? foundIdx + 1 : 1;
                router.replace(`/course/${courseCode}?lesson=${idx}`, { scroll: false });
            } else {
                router.replace(`/course/${courseCode}`, { scroll: false });
            }
        }
    }, [courseCode, data?.Detail, router]);

    return (
        <div className="flex flex-col lg:flex-row" style={{ height: '100%', width: '100%', gap: 16 }}>
            <div className="hidden lg:block" style={{ flex: '1.6 1.6 0%', minWidth: 0, minHeight: 0 }}>
                <Timeline 
                    data={data} 
                    props={params} 
                    selectedLessonId={activeLessonId} 
                    onSelectLesson={handleSelectLesson} 
                />
            </div>
            <div className="lg:flex-[4] min-w-0">
                <Detail 
                    data={data} 
                    params={params} 
                    initialLessonId={initialLessonId}
                    activeLessonId={activeLessonId}
                    onSelectLesson={handleSelectLesson}
                    studentsx={students} 
                    users={users}
                >
                    <Timeline 
                        data={data} 
                        props={params} 
                        selectedLessonId={activeLessonId} 
                        onSelectLesson={handleSelectLesson} 
                    />
                </Detail>
            </div>
        </div>
    );
}
