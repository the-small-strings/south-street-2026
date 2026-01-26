import fs from 'fs';
import path from 'path';
import os from 'os';
import { saveStateToDisk, loadStateFromDisk } from './state';
import type { PersistedState } from './types';

describe('State Persistence', () => {
  let testStateFile: string;
  const originalEnv = process.env.STATE_FILE;

  beforeEach(() => {
    // Create a unique temp file for each test
    testStateFile = path.join(os.tmpdir(), `tss-test-state-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    process.env.STATE_FILE = testStateFile;
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testStateFile)) {
      fs.unlinkSync(testStateFile);
    }
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.STATE_FILE = originalEnv;
    } else {
      delete process.env.STATE_FILE;
    }
  });

  describe('saveStateToDisk', () => {
    it('should save state to the configured file path', () => {
      const state: PersistedState = {
        currentPageIndex: 5,
        battleChoices: { 2: 'A', 4: 'B' },
      };

      saveStateToDisk(state);

      expect(fs.existsSync(testStateFile)).toBe(true);
      const content = fs.readFileSync(testStateFile, 'utf-8');
      const savedState = JSON.parse(content);
      expect(savedState).toEqual(state);
    });

    it('should create directory if it does not exist', () => {
      const nestedDir = path.join(os.tmpdir(), `tss-nested-${Date.now()}`, 'subdir');
      testStateFile = path.join(nestedDir, 'state.json');
      process.env.STATE_FILE = testStateFile;

      const state: PersistedState = {
        currentPageIndex: 0,
        battleChoices: {},
      };

      saveStateToDisk(state);

      expect(fs.existsSync(testStateFile)).toBe(true);

      // Clean up nested directory
      fs.rmSync(path.join(os.tmpdir(), `tss-nested-${Date.now()}`), { recursive: true, force: true });
    });

    it('should overwrite existing state file', () => {
      const state1: PersistedState = {
        currentPageIndex: 1,
        battleChoices: { 0: 'A' },
      };
      const state2: PersistedState = {
        currentPageIndex: 10,
        battleChoices: { 0: 'B', 3: 'A' },
      };

      saveStateToDisk(state1);
      saveStateToDisk(state2);

      const content = fs.readFileSync(testStateFile, 'utf-8');
      const savedState = JSON.parse(content);
      expect(savedState).toEqual(state2);
    });
  });

  describe('loadStateFromDisk', () => {
    it('should load state from the configured file path', () => {
      const state: PersistedState = {
        currentPageIndex: 7,
        battleChoices: { 1: 'B', 5: 'A' },
      };
      fs.writeFileSync(testStateFile, JSON.stringify(state), 'utf-8');

      const loadedState = loadStateFromDisk();

      expect(loadedState).toEqual(state);
    });

    it('should return null if file does not exist', () => {
      // File doesn't exist yet
      const loadedState = loadStateFromDisk();

      expect(loadedState).toBeNull();
    });

    it('should return null if file contains invalid JSON', () => {
      fs.writeFileSync(testStateFile, 'not valid json {{{', 'utf-8');

      const loadedState = loadStateFromDisk();

      expect(loadedState).toBeNull();
    });

    it('should return null if file is empty', () => {
      fs.writeFileSync(testStateFile, '', 'utf-8');

      const loadedState = loadStateFromDisk();

      expect(loadedState).toBeNull();
    });

    it('should return null if file contains only whitespace', () => {
      fs.writeFileSync(testStateFile, '   \n\t  ', 'utf-8');

      const loadedState = loadStateFromDisk();

      expect(loadedState).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('should correctly save and load state', () => {
      const state: PersistedState = {
        currentPageIndex: 15,
        battleChoices: { 0: 'A', 2: 'B', 5: 'A', 8: 'B' },
      };

      saveStateToDisk(state);
      const loadedState = loadStateFromDisk();

      expect(loadedState).toEqual(state);
    });

    it('should handle empty battle choices', () => {
      const state: PersistedState = {
        currentPageIndex: 0,
        battleChoices: {},
      };

      saveStateToDisk(state);
      const loadedState = loadStateFromDisk();

      expect(loadedState).toEqual(state);
    });
  });
});
