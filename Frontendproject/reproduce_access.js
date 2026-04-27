
const BASE_URL = 'http://localhost:5000';

async function run() {
    try {
        const emailA = `teacherA_${Date.now()}@test.com`;
        await fetch(`${BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Teacher A', email: emailA, password: 'password', role: 'teacher' })
        });
        const resLoginA = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailA, password: 'password' })
        });
        const dataLoginA = await resLoginA.json();
        const tokenA = dataLoginA.token;
        console.log('Teacher A logged in');

        const resAssign = await fetch(`${BASE_URL}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
            body: JSON.stringify({ title: 'Assignment A', description: 'Desc', deadline: new Date().toISOString(), maxScore: 100 })
        });
        const dataAssign = await resAssign.json();
        const assignmentId = dataAssign.assignment._id;
        console.log('Assignment A created:', assignmentId);

        const emailB = `teacherB_${Date.now()}@test.com`;
        await fetch(`${BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Teacher B', email: emailB, password: 'password', role: 'teacher' })
        });

        const resLoginB = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailB, password: 'password' })
        });
        const dataLoginB = await resLoginB.json();
        const tokenB = dataLoginB.token;
        console.log('Teacher B logged in');

        const resListB = await fetch(`${BASE_URL}/assignments`, {
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        const listB = await resListB.json();
        console.log('Teacher B assignments list:', listB);

        if (listB.find(a => a._id === assignmentId)) {
            console.error('FAIL: Teacher B can see Assignment A in list!');
        } else {
            console.log('PASS: Teacher B cannot see Assignment A in list.');
        }

        const resSubsB = await fetch(`${BASE_URL}/assignments/${assignmentId}/submissions`, {
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });

        if (resSubsB.status === 403) {
            console.log('PASS: Teacher B denied access to submissions (403).');
        } else {
            const dataSubsB = await resSubsB.json();
            console.error(`FAIL: Teacher B response status ${resSubsB.status}`, dataSubsB);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
