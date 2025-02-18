


/**
 * Class that handles toast messages on the entire application
 */
class ToastManager {
  constructor() {
    this.queue = [];
    this.activeNotification = null;
    this.target = document.getElementById('toast-container');
    this.timeoutId = null;
  }

  addToQueue(notification) {
    // if already in queue do nothing
    if(this.queue.find(queued => queued.message == notification.message))
      return;

    // if active refresh timer
    if(this.activeNotification?.message == notification.message){
      this.refreshActiveTimer()
      return;
    }

    // add to queue
    this.queue.push(notification);
    if (!this.activeNotification) this.serveQueue();
  }

  refreshActiveTimer(){
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.closeActiveNotification();
    }, this.activeNotification.displayTime * 1000);
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
      `<div class="notification w-80 text-center margin-1 not-${notification.gravity} flex align-center">
      <div class="notification-message flex-1 padding-1">
        ${notification.message}
      </div>
      <div class="button accent-1 icon icon-only icon-small" onclick="closeActiveNotification()">
        <i class="fa-solid fa-x"></i>
      </div>
    </div>`;

    const elem = convertToHTML(elemStr)
    this.target.append(elem);

    setTimeout(() => elem.classList.add('anim-in'), 0);
    
    this.timeoutId = setTimeout(() => {
      elem.classList.add('anim-out');
      this.closeActiveNotification(true);
    }, notification.displayTime * 1000 + 400);
  }

  closeActiveNotification(wait = false) {
    clearTimeout(this.timeoutId);
    // additional fixed time for animations
    this.timeoutId = setTimeout(() => {
      this.target.innerHTML = '';
      this.activeNotification = null;
      this.serveQueue();
    }, 400 * wait)
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
  constructor({ message = '', gravity = 'info', displayTime = 2 } = {}) {
    if (!message) throw new Error("Notification cannot have empty message!");

    this.message = message;
    this.gravity = gravity;
    this.displayTime = displayTime;

    toastManager.addToQueue(this);
  }
}


// test notifications
// new Notification({message: "Messaggio di info", displayTime: 1});
// new Notification({message: "Messaggio di avviso", gravity: 'warn'});
// new Notification({message: "Messaggio di errore!", gravity: 'error'});
