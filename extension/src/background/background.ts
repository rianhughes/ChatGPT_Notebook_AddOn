import browser from "../browser/extensionApi";
import {
  broadcastToChatGptTabs,
  ensureActiveCapturableContentScript,
  ensureChatGptContentScript,
  getActiveChatGptContext,
  sendMessageToActiveChatGptTab,
} from "../browser/tabs";
import {
  type ExtensionMessage,
  type AutosaveStatusResponse,
  type CloudBackupListResponse,
  type CloudBackupStatusResponse,
  type DeleteCloudBackupsResponse,
  type InsertTextInChatGptResponse,
  type LockCloudSyncResponse,
  type OpenSidebarWindowResponse,
  type RotateCloudSyncPassphraseResponse,
  type RestoreCloudBackupResponse,
  type SaveChatGptMessageResponse,
  type SetupEncryptedCloudSyncResponse,
  type SubmitAiOperationPackageResponse,
  type UnlockCloudSyncResponse,
  isExtensionMessage,
} from "../core/ports";
import {
  appendSavedMessageFromChatGpt,
  getActiveSaveTargetThread,
  getSavedStateForVisibleMessages,
  saveAiOperationProposal,
  setActiveSaveTargetThread,
} from "../core/repository";
import { createSidebarAdapter } from "./sidebarAdapter";
import { forceNotebookAutosave, getAutosaveStatus, noteNotebookDataChanged } from "./autosave";
import {
  queueCloudBackup,
  forceCloudBackup,
  getCloudBackupStatus,
  deleteCloudBackups,
  listCloudBackups,
  restoreCloudBackup,
} from "./cloudBackup";
import { signOutCloud, startGoogleSignIn } from "./cloudAuth";
import {
  lockCloudSync,
  rotateCloudSyncPassphrase,
  setupEncryptedCloudSync,
  unlockCloudSyncWithPassphrase,
  unlockCloudSyncWithRecoveryPhrase,
} from "./cloudKeyring";
import { initializeDetachedSidebarWindowTracking, openDetachedSidebarWindow } from "./sidebarWindow";

type ActionClickTab = {
  id?: number;
  url?: string;
  windowId?: number;
};

type ActionApi = {
  onClicked?: {
    addListener(listener: (tab?: ActionClickTab) => void): void;
  };
};

const sidebarAdapter = createSidebarAdapter();

void sidebarAdapter.initialize();
initializeDetachedSidebarWindowTracking();

const actionApi = ((browser as unknown as { action?: ActionApi; browserAction?: ActionApi }).action ??
  (browser as unknown as { browserAction?: ActionApi }).browserAction) as ActionApi | undefined;

actionApi?.onClicked?.addListener((tab) => {
  void openSidebarFromActionClick(tab);
});

browser.runtime.onMessage.addListener((rawMessage: unknown) => {
  if (!isExtensionMessage(rawMessage)) {
    return undefined;
  }

  return handleMessage(rawMessage);
});

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "SAVE_CHATGPT_MESSAGE": {
      const result = await appendSavedMessageFromChatGpt(message.payload);
      await noteNotebookDataChanged();
      const response: SaveChatGptMessageResponse = {
        sourceThreadId: message.payload.sourceThreadId,
        sourceMessageKey: message.payload.sourceMessageKey,
        savedMessageId: result.message.id,
        status: result.status,
      };

      await broadcastToChatGptTabs({
        type: "SOURCE_MESSAGE_SAVED_STATE_CHANGED",
        payload: {
          sourceThreadId: message.payload.sourceThreadId,
          sourceMessageKey: message.payload.sourceMessageKey,
          saved: true,
        },
      });

      return response;
    }
    case "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES":
      return getSavedStateForVisibleMessages(
        message.payload.sourceThreadId,
        message.payload.sourceMessageKeys,
        message.payload.source === "deepwiki" ? "deepwiki" : "chatgpt",
      );
    case "GET_ACTIVE_CHATGPT_CONTEXT":
      await ensureActiveCapturableContentScript();
      return getActiveChatGptContext();
    case "GET_ACTIVE_SAVE_TARGET":
      return getActiveSaveTargetThread();
    case "SET_ACTIVE_SAVE_TARGET": {
      const thread = await setActiveSaveTargetThread(message.payload.threadId);
      await noteNotebookDataChanged();

      await broadcastToChatGptTabs({
        type: "ACTIVE_SAVE_TARGET_CHANGED",
        payload: {
          threadId: thread?.id ?? null,
          title: thread?.title ?? null,
          source: thread?.source ?? null,
        },
      });

      return thread;
    }
    case "INSERT_TEXT_IN_CHATGPT": {
      const response = await sendMessageToActiveChatGptTab<InsertTextInChatGptResponse>(message);
      return (
        response ?? {
          inserted: false,
        }
      );
    }
    case "SUBMIT_AI_OPERATION_PACKAGE": {
      try {
        const proposal = await saveAiOperationProposal(message.payload);
        await noteNotebookDataChanged();

        try {
          await openDetachedSidebarWindow();
        } catch {
          await sidebarAdapter.openForCurrentWindow({});
        }

        return {
          queued: true,
          proposalId: proposal.id,
        } satisfies SubmitAiOperationPackageResponse;
      } catch {
        return {
          queued: false,
          error: "Could not queue ChatGPT note changes.",
        } satisfies SubmitAiOperationPackageResponse;
      }
    }
    case "OPEN_SIDEBAR_WINDOW": {
      try {
        await openDetachedSidebarWindow();
        return { opened: true } satisfies OpenSidebarWindowResponse;
      } catch {
        return {
          opened: false,
          error: "Could not open notes window.",
        } satisfies OpenSidebarWindowResponse;
      }
    }
    case "NOTEBOOK_DATA_CHANGED":
      await noteNotebookDataChanged();
      return getAutosaveStatus();
    case "GET_AUTOSAVE_STATUS":
      return getAutosaveStatus() satisfies Promise<AutosaveStatusResponse>;
    case "FORCE_AUTOSAVE":
      return forceNotebookAutosave() satisfies Promise<AutosaveStatusResponse>;
    case "GET_CLOUD_BACKUP_STATUS":
      return getCloudBackupStatus() satisfies Promise<CloudBackupStatusResponse>;
    case "START_GOOGLE_SIGN_IN":
      return startGoogleSignIn() satisfies Promise<CloudBackupStatusResponse>;
    case "SIGN_OUT_CLOUD":
      return signOutCloud() satisfies Promise<CloudBackupStatusResponse>;
    case "SETUP_ENCRYPTED_CLOUD_SYNC":
      try {
        const result = await setupEncryptedCloudSync(message.payload.passphrase);
        await queueCloudBackup();

        return {
          enabled: true,
          recoveryPhrase: result.recoveryPhrase,
          status: await getCloudBackupStatus(),
        } satisfies SetupEncryptedCloudSyncResponse;
      } catch (error) {
        return {
          enabled: false,
          status: await getCloudBackupStatus(),
          error: error instanceof Error ? error.message : "Could not enable encrypted cloud sync.",
        } satisfies SetupEncryptedCloudSyncResponse;
      }
    case "UNLOCK_CLOUD_SYNC_WITH_PASSPHRASE":
      try {
        await unlockCloudSyncWithPassphrase(message.payload.passphrase);
        await queueCloudBackup();

        return {
          unlocked: true,
          status: await getCloudBackupStatus(),
        } satisfies UnlockCloudSyncResponse;
      } catch (error) {
        return {
          unlocked: false,
          status: await getCloudBackupStatus(),
          error: error instanceof Error ? error.message : "Could not unlock encrypted cloud sync.",
        } satisfies UnlockCloudSyncResponse;
      }
    case "UNLOCK_CLOUD_SYNC_WITH_RECOVERY_PHRASE":
      try {
        await unlockCloudSyncWithRecoveryPhrase(message.payload.recoveryPhrase);
        await queueCloudBackup();

        return {
          unlocked: true,
          status: await getCloudBackupStatus(),
        } satisfies UnlockCloudSyncResponse;
      } catch (error) {
        return {
          unlocked: false,
          status: await getCloudBackupStatus(),
          error: error instanceof Error ? error.message : "Could not unlock encrypted cloud sync.",
        } satisfies UnlockCloudSyncResponse;
      }
    case "ROTATE_CLOUD_SYNC_PASSPHRASE":
      try {
        await rotateCloudSyncPassphrase({
          currentPassphrase: message.payload.currentPassphrase,
          newPassphrase: message.payload.newPassphrase,
        });

        return {
          rotated: true,
          status: await getCloudBackupStatus(),
        } satisfies RotateCloudSyncPassphraseResponse;
      } catch (error) {
        return {
          rotated: false,
          status: await getCloudBackupStatus(),
          error: error instanceof Error ? error.message : "Could not rotate cloud sync passphrase.",
        } satisfies RotateCloudSyncPassphraseResponse;
      }
    case "LOCK_CLOUD_SYNC":
      try {
        await lockCloudSync();

        return {
          locked: true,
          status: await getCloudBackupStatus(),
        } satisfies LockCloudSyncResponse;
      } catch (error) {
        return {
          locked: false,
          status: await getCloudBackupStatus(),
          error: error instanceof Error ? error.message : "Could not lock encrypted cloud sync.",
        } satisfies LockCloudSyncResponse;
      }
    case "FORCE_CLOUD_BACKUP":
      return forceCloudBackup() satisfies Promise<CloudBackupStatusResponse>;
    case "LIST_CLOUD_BACKUPS":
      return listCloudBackups() satisfies Promise<CloudBackupListResponse>;
    case "RESTORE_CLOUD_BACKUP": {
      const response = await restoreCloudBackup(message.payload.backupId);

      if (response.restored) {
        await noteNotebookDataChanged();
      }

      return response satisfies RestoreCloudBackupResponse;
    }
    case "DELETE_CLOUD_BACKUPS":
      return deleteCloudBackups() satisfies Promise<DeleteCloudBackupsResponse>;
    case "CHATGPT_THREAD_CHANGED":
    case "SAVE_CHATGPT_MESSAGE_RESULT":
    case "ACTIVE_SAVE_TARGET_CHANGED":
    case "SOURCE_MESSAGE_SAVED_STATE_CHANGED":
      return undefined;
    default:
      return undefined;
  }
}

async function openSidebarFromActionClick(tab?: ActionClickTab): Promise<void> {
  try {
    await sidebarAdapter.toggleForCurrentWindow({
      windowId: tab?.windowId,
      tabId: tab?.id,
    });
  } catch {
    // Chrome can already open the side panel via setPanelBehavior.
  }

  if (tab) {
    try {
      await ensureChatGptContentScript(tab);
    } catch {
      // The active tab may not allow script injection, or the script may already be present.
    }
  }
}
