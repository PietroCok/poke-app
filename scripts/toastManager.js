
/**
 * Class that handles toast messages on the entire application
 */
class ToastManager {
  constructor() {
    this.queue = [];
    this.activeNotification = null;
    this.target = document.getElementById('toast-container');
    this.timeoutId = null;
    this.fadeTime = 400; // time allocated for fade animation (out only)
  }

  addToQueue(notification) {
    // if already in queue do nothing
    if(this.queue.find(queued => queued.message == notification.message))
      return;

    // if active refresh timer
    if(this.activeNotification?.message == notification.message){
      const time_left = performance.now() - this.activeNotification.startTimeDisplay - this.activeNotification.displayTime * 1000;
      
      // if fade out animation has already started, add the notification as new one
      if(time_left < 0){
        this.refreshActiveTimer();
        return;
      }
    }

    // add to queue
    this.queue.push(notification);
    if (!this.activeNotification) this.serveQueue();
  }

  refreshActiveTimer(){
    this.activeNotification.startTimeDisplay = performance.now();
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      document.getElementById('notification').classList.add('anim-out');
      this.closeActiveNotification(true);
    }, this.activeNotification.displayTime * 1000 + this.fadeTime);
  }

  /**
   * Extract first notification from queue and send to show
   */
  async serveQueue() {
    if (this.queue.length <= 0) return;

    const nextNotification = this.queue.shift();
    this.activeNotification = nextNotification;

    this.showNotification(nextNotification);
  }

  /**
   * Show single notification
   */
  async showNotification(notification) {
    const elemStr =
      `<div id="notification" class="notification w-80 text-center margin-1 toast-${notification.gravity} flex align-center">
      <div class="notification-message flex-1 padding-1">
        ${notification.message}
      </div>
      <div class="button accent-1 icon icon-only icon-small" onclick="closeActiveNotification()">
        <i class="fa-solid fa-x"></i>
      </div>
    </div>`;

    const elem = convertToHTML(elemStr)

    if(notification.targetId){
      // Alternate location
      const altTarget = document.getElementById(notification.targetId);
      if(altTarget) altTarget.append(elem);
    } else {
      // Default location
      this.target.append(elem);
    }

    setTimeout(() => elem.classList.add('anim-in'), 0);
    notification.startTimeDisplay = performance.now();
    
    this.timeoutId = setTimeout(() => {
      
      elem.classList.add('anim-out');
      this.closeActiveNotification(true);
    }, notification.displayTime * 1000);
  }

  closeActiveNotification(wait = false) {
    clearTimeout(this.timeoutId);
    // additional fixed time for animations
    this.timeoutId = setTimeout(() => {
      
      if(this.activeNotification.targetId){
        const altTarget = document.getElementById(this.activeNotification.targetId);
        altTarget.innerHTML = '';
      } else {
        this.target.innerHTML = '';
      }
      this.activeNotification = null;
      this.serveQueue();
    }, this.fadeTime * wait)
  }
}

function closeActiveNotification(){
  toastManager.closeActiveNotification();
}

const toastManager = new ToastManager();

class Notification {
  /**
   * @param {Object} options - notification options
   * @param {string} options.message - message to display
   * @param {string} [options.gravity=info] - gravity of the message -> pilots color
   * @param {Number} [options.displayTime=1] - display time of the message
   */
  constructor({ message = '', gravity = 'info', displayTime = 2, targetId = '' } = {}) {
    if (!message) throw new Error("Notification cannot have empty message!");

    this.message = message;
    this.gravity = gravity;
    this.displayTime = displayTime;
    this.targetId = targetId;
    this.startTimeDisplay = null; // time when the notification is first shown

    toastManager.addToQueue(this);
  }
}


// test notifications
// new Notification({message: "Messaggio di info", displayTime: 1});
// new Notification({message: "Messaggio di avviso", gravity: 'warn'});
// new Notification({message: "Messaggio di errore!", gravity: 'error'});
