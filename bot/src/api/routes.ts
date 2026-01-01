import { Router, Request, Response } from 'express';
import { Client } from 'discord.js';
import GuildConfig from '../models/GuildConfig';
import ModCase from '../models/ModCase';
import User from '../models/User';
import jwt from 'jsonwebtoken';

export default function createRoutes(client: Client) {
  const router = Router();

  // Middleware to verify JWT
  const verifyToken = (req: any, res: Response, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Get guild config
  router.get('/guild/:guildId/config', verifyToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      // Check if user has admin permissions
      const member = await guild.members.fetch(req.user.id).catch(() => null);
      if (!member || !member.permissions.has('Administrator')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      let config = await GuildConfig.findOne({ guildId });
      
      if (!config) {
        config = await GuildConfig.create({
          guildId,
          guildName: guild.name,
          prefix: '!',
          autoModEnabled: false
        });
      }

      res.json(config);
    } catch (error) {
      console.error('Error fetching guild config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update guild config
  router.patch('/guild/:guildId/config', verifyToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const updates = req.body;
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const member = await guild.members.fetch(req.user.id).catch(() => null);
      if (!member || !member.permissions.has('Administrator')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const config = await GuildConfig.findOneAndUpdate(
        { guildId },
        { $set: updates },
        { new: true, upsert: true }
      );

      res.json(config);
    } catch (error) {
      console.error('Error updating guild config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get guild statistics
  router.get('/guild/:guildId/stats', verifyToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const member = await guild.members.fetch(req.user.id).catch(() => null);
      if (!member || !member.permissions.has('Administrator')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Get mod case statistics
      const totalCases = await ModCase.countDocuments({ guildId });
      const activeBans = await ModCase.countDocuments({ guildId, type: 'ban', active: true });
      const totalWarnings = await ModCase.countDocuments({ guildId, type: 'warn' });
      
      // Get recent cases
      const recentCases = await ModCase.find({ guildId })
        .sort({ createdAt: -1 })
        .limit(10);

      // Get top warned users
      const topWarnedUsers = await User.find({ guildId })
        .sort({ warnings: -1 })
        .limit(5);

      res.json({
        guild: {
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL(),
          memberCount: guild.memberCount
        },
        stats: {
          totalCases,
          activeBans,
          totalWarnings
        },
        recentCases,
        topWarnedUsers
      });
    } catch (error) {
      console.error('Error fetching guild stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get guild channels
  router.get('/guild/:guildId/channels', verifyToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const member = await guild.members.fetch(req.user.id).catch(() => null);
      if (!member || !member.permissions.has('Administrator')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const channels = guild.channels.cache
        .filter(ch => ch.isTextBased())
        .map(ch => ({
          id: ch.id,
          name: ch.name,
          type: ch.type
        }));

      res.json(channels);
    } catch (error) {
      console.error('Error fetching guild channels:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get guild roles
  router.get('/guild/:guildId/roles', verifyToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const member = await guild.members.fetch(req.user.id).catch(() => null);
      if (!member || !member.permissions.has('Administrator')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const roles = guild.roles.cache
        .filter(role => role.id !== guild.id)
        .map(role => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position
        }))
        .sort((a, b) => b.position - a.position);

      res.json(roles);
    } catch (error) {
      console.error('Error fetching guild roles:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
