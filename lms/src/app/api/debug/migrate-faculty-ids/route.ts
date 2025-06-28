import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // 1. Fetch all faculty members
    const facultyUsers = await usersCollection.find({ role: 'Faculty' }).toArray();

    let maxId = 0;
    const usersToUpdate = [];

    // 2. Find the highest existing ID number and identify users needing an update
    for (const user of facultyUsers) {
      if (user.facultyId && /^IINR-\d{3,}$/.test(user.facultyId)) {
        const idNumber = parseInt(user.facultyId.split('-')[1], 10);
        if (!isNaN(idNumber) && idNumber > maxId) {
          maxId = idNumber;
        }
      } else {
        // This user needs a new ID
        usersToUpdate.push(user);
      }
    }

    console.log(`Found ${usersToUpdate.length} faculty users needing an ID update. Starting new IDs from ${maxId + 1}.`);

    // 3. Generate new IDs and update the records
    const updatePromises = [];
    let currentIdCounter = maxId + 1;

    for (const user of usersToUpdate) {
      const newFacultyId = `IINR-${String(currentIdCounter).padStart(3, '0')}`;
      console.log(`Updating user ${user.name} (${user._id}) from '${user.facultyId || 'N/A'}' to '${newFacultyId}'`);
      
      const promise = usersCollection.updateOne(
        { _id: user._id },
        { $set: { facultyId: newFacultyId } }
      );
      updatePromises.push(promise);
      currentIdCounter++;
    }

    // 4. Execute all updates
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    const message = `Migration complete. ${updatePromises.length} faculty records were updated with the new ID format.`;
    console.log(message);

    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error('Error during faculty ID migration:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}