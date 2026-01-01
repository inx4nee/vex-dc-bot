'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface GuildConfig {
  guildId: string;
  guildName: string;
  prefix: string;
  modLogChannel?: string;
  muteRole?: string;
  autoModEnabled: boolean;
  autoModSettings: {
    antiSpam: boolean;
    antiInvite: boolean;
    antiLink: boolean;
    antiCaps: boolean;
    profanityFilter: boolean;
    maxMentions: number;
    maxEmojis: number;
  };
  welcomeSettings: {
    enabled: boolean;
    channel?: string;
    message: string;
  };
  farewellSettings: {
    enabled: boolean;
    channel?: string;
    message: string;
  };
  levelingEnabled: boolean;
  moderatorRoles: string[];
  adminRoles: string[];
}

export default function GuildDashboard() {
  const params = useParams();
  const guildId = params.guildId as string;
  
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadGuildData();
  }, [guildId]);

  const loadGuildData = async () => {
    try {
      // In production, you'd get the token from auth
      const token = 'dummy-token';
      
      const [configRes, channelsRes, rolesRes] = await Promise.all([
        fetch(`http://localhost:3001/api/guild/${guildId}/config`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:3001/api/guild/${guildId}/channels`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:3001/api/guild/${guildId}/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const configData = await configRes.json();
      const channelsData = await channelsRes.json();
      const rolesData = await rolesRes.json();

      setConfig(configData);
      setChannels(channelsData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading guild data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const token = 'dummy-token';
      await fetch(`http://localhost:3001/api/guild/${guildId}/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;
    
    const newConfig = { ...config };
    const keys = path.split('.');
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Guild not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-discord-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-white hover:text-discord-blurple">
                ← Back to Servers
              </Link>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">{config.guildName}</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-discord-gray mb-6">
          <nav className="flex space-x-8">
            {['general', 'moderation', 'automod', 'welcome', 'leveling'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-discord-blurple text-discord-blurple'
                    : 'border-transparent text-discord-lightgray hover:text-white hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="card space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">General Settings</h2>
            
            <div>
              <label className="block text-sm font-medium text-discord-lightgray mb-2">
                Command Prefix
              </label>
              <input
                type="text"
                className="input-field w-full max-w-xs"
                value={config.prefix}
                onChange={(e) => updateConfig('prefix', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-discord-lightgray mb-2">
                Mod Log Channel
              </label>
              <select
                className="input-field w-full max-w-xs"
                value={config.modLogChannel || ''}
                onChange={(e) => updateConfig('modLogChannel', e.target.value)}
              >
                <option value="">None</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    #{ch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Moderation Settings */}
        {activeTab === 'moderation' && (
          <div className="card space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Moderation Settings</h2>
            
            <div>
              <label className="block text-sm font-medium text-discord-lightgray mb-2">
                Moderator Roles
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.moderatorRoles.includes(role.id)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...config.moderatorRoles, role.id]
                          : config.moderatorRoles.filter((r) => r !== role.id);
                        updateConfig('moderatorRoles', newRoles);
                      }}
                      className="mr-2"
                    />
                    <span className="text-white">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-discord-lightgray mb-2">
                Admin Roles
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.adminRoles.includes(role.id)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...config.adminRoles, role.id]
                          : config.adminRoles.filter((r) => r !== role.id);
                        updateConfig('adminRoles', newRoles);
                      }}
                      className="mr-2"
                    />
                    <span className="text-white">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Auto-Moderation Settings */}
        {activeTab === 'automod' && (
          <div className="card space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Auto-Moderation</h2>
            
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Enable Auto-Moderation</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.autoModEnabled}
                  onChange={(e) => updateConfig('autoModEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {config.autoModEnabled && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-white">Anti-Spam</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.autoModSettings.antiSpam}
                      onChange={(e) => updateConfig('autoModSettings.antiSpam', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white">Anti-Invite</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.autoModSettings.antiInvite}
                      onChange={(e) => updateConfig('autoModSettings.antiInvite', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white">Anti-Link</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.autoModSettings.antiLink}
                      onChange={(e) => updateConfig('autoModSettings.antiLink', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white">Anti-Caps</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.autoModSettings.antiCaps}
                      onChange={(e) => updateConfig('autoModSettings.antiCaps', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-discord-lightgray mb-2">
                    Max Mentions
                  </label>
                  <input
                    type="number"
                    className="input-field w-full max-w-xs"
                    value={config.autoModSettings.maxMentions}
                    onChange={(e) => updateConfig('autoModSettings.maxMentions', parseInt(e.target.value))}
                    min="1"
                    max="20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-discord-lightgray mb-2">
                    Max Emojis
                  </label>
                  <input
                    type="number"
                    className="input-field w-full max-w-xs"
                    value={config.autoModSettings.maxEmojis}
                    onChange={(e) => updateConfig('autoModSettings.maxEmojis', parseInt(e.target.value))}
                    min="1"
                    max="50"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Welcome Settings */}
        {activeTab === 'welcome' && (
          <div className="card space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Welcome & Farewell</h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Welcome Messages</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-white">Enable Welcome Messages</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.welcomeSettings.enabled}
                    onChange={(e) => updateConfig('welcomeSettings.enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {config.welcomeSettings.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-discord-lightgray mb-2">
                      Welcome Channel
                    </label>
                    <select
                      className="input-field w-full max-w-xs"
                      value={config.welcomeSettings.channel || ''}
                      onChange={(e) => updateConfig('welcomeSettings.channel', e.target.value)}
                    >
                      <option value="">None</option>
                      {channels.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          #{ch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-discord-lightgray mb-2">
                      Welcome Message (use {'{user}'} and {'{server}'})
                    </label>
                    <textarea
                      className="input-field w-full"
                      rows={3}
                      value={config.welcomeSettings.message}
                      onChange={(e) => updateConfig('welcomeSettings.message', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-discord-gray">
              <h3 className="text-lg font-semibold text-white">Farewell Messages</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-white">Enable Farewell Messages</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.farewellSettings.enabled}
                    onChange={(e) => updateConfig('farewellSettings.enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {config.farewellSettings.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-discord-lightgray mb-2">
                      Farewell Channel
                    </label>
                    <select
                      className="input-field w-full max-w-xs"
                      value={config.farewellSettings.channel || ''}
                      onChange={(e) => updateConfig('farewellSettings.channel', e.target.value)}
                    >
                      <option value="">None</option>
                      {channels.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          #{ch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-discord-lightgray mb-2">
                      Farewell Message (use {'{user}'} and {'{server}'})
                    </label>
                    <textarea
                      className="input-field w-full"
                      rows={3}
                      value={config.farewellSettings.message}
                      onChange={(e) => updateConfig('farewellSettings.message', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Leveling Settings */}
        {activeTab === 'leveling' && (
          <div className="card space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Leveling System</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-medium block">Enable Leveling System</span>
                <span className="text-discord-lightgray text-sm">Members gain XP and level up by chatting</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.levelingEnabled}
                  onChange={(e) => updateConfig('levelingEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="btn-primary px-8 py-3 text-lg"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
