const express = require('express');
const { supabase } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's teams
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: teams, error } = await supabase
      .from('team_members')
      .select(`
        *,
        teams (
          id,
          name,
          description,
          created_at
        )
      `)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch teams' });
    }

    res.json({ teams });
  } catch (error) {
    console.error('Teams fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create new team
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert([
        {
          name,
          description,
          owner_id: req.user.id,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (teamError) {
      return res.status(500).json({ error: 'Failed to create team' });
    }

    // Add owner as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert([
        {
          team_id: team.id,
          user_id: req.user.id,
          role: 'owner',
          joined_at: new Date().toISOString()
        }
      ]);

    if (memberError) {
      console.error('Team member creation error:', memberError);
    }

    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    console.error('Team creation error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Get team analytics
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    // Check if user is member of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get team members
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        *,
        users (
          id,
          full_name,
          email
        )
      `)
      .eq('team_id', id);

    if (membersError) {
      return res.status(500).json({ error: 'Failed to fetch team members' });
    }

    const memberIds = members.map(m => m.user_id);

    // Get AI calls for all team members
    let query = supabase
      .from('ai_calls')
      .select('*')
      .in('user_id', memberIds);

    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);

    const { data: aiCalls, error: callsError } = await query;

    if (callsError) {
      return res.status(500).json({ error: 'Failed to fetch team analytics' });
    }

    // Calculate team analytics
    const totalCalls = aiCalls.length;
    const totalCost = aiCalls.reduce((sum, call) => sum + (call.total_cost || 0), 0);
    const totalTokens = aiCalls.reduce((sum, call) => sum + (call.tokens_in || 0) + (call.tokens_out || 0), 0);

    // Per-member breakdown
    const memberStats = members.map(member => {
      const memberCalls = aiCalls.filter(call => call.user_id === member.user_id);
      return {
        user: member.users,
        calls: memberCalls.length,
        cost: memberCalls.reduce((sum, call) => sum + (call.total_cost || 0), 0),
        tokens: memberCalls.reduce((sum, call) => sum + (call.tokens_in || 0) + (call.tokens_out || 0), 0)
      };
    });

    res.json({
      teamStats: {
        totalCalls,
        totalCost,
        totalTokens,
        memberCount: members.length
      },
      memberStats
    });
  } catch (error) {
    console.error('Team analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch team analytics' });
  }
});

// Invite user to team
router.post('/:id/invite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user is owner or admin of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find user by email
    const { data: invitedUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const { data: existingMember, error: existingError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', id)
      .eq('user_id', invitedUser.id)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    // Add user to team
    const { data: newMember, error: memberError } = await supabase
      .from('team_members')
      .insert([
        {
          team_id: id,
          user_id: invitedUser.id,
          role,
          joined_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (memberError) {
      return res.status(500).json({ error: 'Failed to add team member' });
    }

    res.status(201).json({
      message: 'User invited to team successfully',
      member: newMember
    });
  } catch (error) {
    console.error('Team invitation error:', error);
    res.status(500).json({ error: 'Failed to invite user to team' });
  }
});

module.exports = router;