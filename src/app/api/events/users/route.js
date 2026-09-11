import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import User from '@/models/users';

export async function GET() {
    try {
        await connectDB();
        const users = await User.find({ status: true }, 'name avt email phone role').sort({ name: 1 }).lean();
        return NextResponse.json({ success: true, users }, { status: 200 });
    } catch (error) {
        console.error('Error fetching users for events:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
