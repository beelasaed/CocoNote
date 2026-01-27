document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('ranking-list-container');
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch leaderboard data from API
        const response = await fetch('/api/auth/leaderboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }

        const leaderboard = await response.json();
        console.log('Leaderboard:', leaderboard);

        if (leaderboard.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No data yet.</p>';
            return;
        }

        // Update podium with top 3
        updatePodium(leaderboard.slice(0, 3));

        // Display remaining rankings (4+)
        const remainingRankings = leaderboard.slice(3);
        container.innerHTML = remainingRankings.map(user => `
            <div class="rank-row" onclick="navigateToUserProfile(${user.user_id})" style="cursor: pointer;">
                <span class="rank-number">#${user.rank}</span>
                <span style="font-weight: 600;">${user.name}</span>
                <span class="hide-mobile" style="color: #888;">${user.department || 'N/A'}</span>
                <span class="rank-upvotes">${user.total_upvotes}</span>
                <span class="rank-downloads">${user.total_downloads}</span>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error:', err);
        container.innerHTML = `<p style="text-align: center; color: #c33; padding: 40px;">Failed to load leaderboard: ${err.message}</p>`;
    }
});

function updatePodium(topThree) {
    // Get podium sections
    const podiumItems = document.querySelectorAll('.podium-item');
    
    // Map: rank index 0 (1st) -> gold (middle), 1 (2nd) -> silver (left), 2 (3rd) -> bronze (right)
    const positionMap = {
        0: 1, // 1st place -> gold (podium-item[1])
        1: 0, // 2nd place -> silver (podium-item[0])
        2: 2  // 3rd place -> bronze (podium-item[2])
    };

    topThree.forEach((user, index) => {
        const podiumIndex = positionMap[index];
        const podium = podiumItems[podiumIndex];
        
        if (podium) {
            const h3 = podium.querySelector('h3');
            const deptTag = podium.querySelector('.dept-tag');
            const pointsPill = podium.querySelector('.points-pill');
            
            h3.textContent = user.name;
            h3.style.cursor = 'pointer';
            h3.onclick = (e) => {
                e.stopPropagation();
                navigateToUserProfile(user.user_id);
            };
            
            deptTag.textContent = user.department || 'N/A';
            pointsPill.textContent = `${user.total_upvotes} 👍 | ${user.total_downloads} 📥`;
            pointsPill.style.cursor = 'pointer';
            pointsPill.onclick = (e) => {
                e.stopPropagation();
                navigateToUserProfile(user.user_id);
            };

            // Make podium item clickable
            podium.style.cursor = 'pointer';
            podium.onclick = () => navigateToUserProfile(user.user_id);
        }
    });
}

function navigateToUserProfile(userId) {
    window.location.href = `user-profile.html?id=${userId}`;
}