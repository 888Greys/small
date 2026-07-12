document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // DOM ELEMENT REFERENCES
  // ==========================================================================
  
  // Stages
  const loginStage = document.getElementById('login-stage');
  const otpStage = document.getElementById('otp-stage');
  const dashboardStage = document.getElementById('dashboard-stage');
  
  // Forms & Inputs
  const claimForm = document.getElementById('claim-form');
  const phoneNumberInput = document.getElementById('phone-number');
  const secretPinInput = document.getElementById('secret-pin');
  const otpInputs = document.querySelectorAll('.otp-box');
  
  // Toggles & Errors
  const phoneError = document.getElementById('phone-error');
  const pinError = document.getElementById('pin-error');
  const togglePwdBtn = document.getElementById('toggle-pwd');
  
  // Action Buttons
  const btnSubmit = document.getElementById('btn-submit');
  const btnVerify = document.getElementById('btn-verify');
  const btnResend = document.getElementById('btn-resend');
  const btnBack = document.getElementById('btn-back');
  const btnLogout = document.getElementById('btn-logout');
  
  // Text Displays
  const userPhoneDisplay = document.getElementById('user-phone-display');
  const dashPhoneDisplay = document.getElementById('dash-phone-display');
  const otpTimer = document.getElementById('otp-timer');
  
  // Dashboard Metrics
  const dataVal = document.getElementById('data-val');
  const usedDataVal = document.getElementById('used-data-val');
  const progressRingCircle = document.querySelector('.progress-ring__circle');
  
  // Speed Sim Elements
  const speedPing = document.getElementById('speed-ping');
  const speedDl = document.getElementById('speed-dl');
  const speedUl = document.getElementById('speed-ul');
  const toggle5G = document.getElementById('toggle-5g');
  
  // Spin Wheel Elements
  const spinWheel = document.getElementById('spin-wheel');
  const btnSpin = document.getElementById('btn-spin');
  const spinStatus = document.getElementById('spin-status');
  const toast = document.getElementById('toast');
  
  // ==========================================================================
  // APP STATE
  // ==========================================================================
  let userPhone = '';
  let countdownInterval = null;
  let speedInterval = null;
  let totalData = 50.0;
  let usedData = 0.2;
  let hasSpun = false;

  // Wheel sectors (defined counter-clockwise in css)
  const wheelSectors = [
    { label: "Jaribu Tena (Try Again)", value: 0 },
    { label: "500 MB", value: 0.5 },
    { label: "250 MB", value: 0.25 },
    { label: "1 GB", value: 1.0 },
    { label: "Subiri Kesho (Try Tomorrow)", value: 0 },
    { label: "5 GB!", value: 5.0 },
    { label: "100 MB", value: 0.1 },
    { label: "2 GB", value: 2.0 }
  ];

  // ==========================================================================
  // VIEW NAVIGATION & TRANSITIONS
  // ==========================================================================
  function showStage(stageToShow) {
    // Fade out active card/container
    const active = document.querySelector('.card.active, .dashboard-container.active');
    if (active) {
      active.style.opacity = '0';
      active.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        active.classList.remove('active');
        active.style.display = 'none';
        
        // Show new stage
        stageToShow.style.display = 'block';
        // Force reflow
        stageToShow.offsetHeight;
        stageToShow.classList.add('active');
        stageToShow.style.opacity = '1';
        stageToShow.style.transform = 'translateY(0)';
      }, 300);
    }
  }

  // ==========================================================================
  // PHONE & PIN VALIDATION
  // ==========================================================================
  
  // Toggle password visibility
  togglePwdBtn.addEventListener('click', () => {
    const isPassword = secretPinInput.type === 'password';
    secretPinInput.type = isPassword ? 'text' : 'password';
    togglePwdBtn.innerHTML = isPassword 
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });

  // Basic validation rules for Tanzanian phone numbers (Tigo: starts with 071, 065, 067, 078, etc.)
  function validatePhone(phone) {
    const cleanPhone = phone.replace(/\s+/g, '');
    // Regex for Tanzania numbers: starting with 06, 07, or +255/255 followed by 9 digits
    const tzRegex = /^(?:\+255|255|0)?[67]\d{8}$/;
    return tzRegex.test(cleanPhone);
  }

  function validatePin(pin) {
    return /^\d{4}$/.test(pin);
  }

  // Clear errors when typing
  phoneNumberInput.addEventListener('input', () => {
    phoneNumberInput.parentElement.classList.remove('has-error');
  });

  secretPinInput.addEventListener('input', () => {
    // Only numbers
    secretPinInput.value = secretPinInput.value.replace(/\D/g, '');
    secretPinInput.parentElement.classList.remove('has-error');
  });

  // Login form submit handler
  claimForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const phone = phoneNumberInput.value.trim();
    const pin = secretPinInput.value.trim();
    let isValid = true;

    if (!validatePhone(phone)) {
      phoneNumberInput.parentElement.classList.add('has-error');
      isValid = false;
    }
    
    if (!validatePin(pin)) {
      secretPinInput.parentElement.classList.add('has-error');
      isValid = false;
    }

    if (isValid) {
      userPhone = phone;
      // Show loading spinner
      btnSubmit.classList.add('loading');
      btnSubmit.disabled = true;

      // Simulate a small network delay (1.5 seconds)
      setTimeout(() => {
        btnSubmit.classList.remove('loading');
        btnSubmit.disabled = false;
        
        // Prepare OTP stage
        // Mask phone number (e.g. 0712******)
        let masked = phone;
        if (phone.length >= 10) {
          masked = phone.substring(0, 4) + '***' + phone.substring(phone.length - 3);
        }
        userPhoneDisplay.textContent = masked;
        dashPhoneDisplay.textContent = phone;
        
        // Start SMS OTP resend timer
        startOtpTimer();

        // Navigate
        showStage(otpStage);
      }, 1500);
    }
  });

  // Back button from OTP stage
  btnBack.addEventListener('click', () => {
    clearInterval(countdownInterval);
    showStage(loginStage);
  });

  // ==========================================================================
  // OTP AUTO-TAB & VERIFICATION
  // ==========================================================================
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      // Only digits allowed
      input.value = input.value.replace(/\D/g, '');
      
      // Auto tab to next box
      if (input.value !== '' && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      // Handle backspace to go to previous box
      if (e.key === 'Backspace' && input.value === '' && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  // SMS Timer logic
  function startOtpTimer() {
    let secondsLeft = 90; // 1 min 30 sec
    btnResend.disabled = true;
    btnResend.classList.remove('active');
    
    clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
      secondsLeft--;
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      
      otpTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      if (secondsLeft <= 0) {
        clearInterval(countdownInterval);
        otpTimer.parentElement.innerHTML = 'Namba tayari imeshaisha muda wake';
        btnResend.disabled = false;
        btnResend.classList.add('active');
      }
    }, 1000);
  }

  // Resend code handler
  btnResend.addEventListener('click', () => {
    // Reset inputs
    otpInputs.forEach(input => input.value = '');
    otpInputs[0].focus();
    
    // Simulate loading on resend
    btnResend.textContent = 'Inatuma...';
    btnResend.style.pointerEvents = 'none';
    
    setTimeout(() => {
      btnResend.innerHTML = 'Tuma Tena SMS';
      btnResend.style.pointerEvents = 'auto';
      
      // Reset timer container HTML structure
      const timerDesc = document.querySelector('.timer-desc');
      timerDesc.innerHTML = 'Unaweza kutuma tena baada ya: <span id="otp-timer" class="highlight">01:30</span>';
      
      // Re-assign reference of the newly created timer span
      const newOtpTimer = document.getElementById('otp-timer');
      
      // Update timer state
      let secondsLeft = 90;
      btnResend.disabled = true;
      btnResend.classList.remove('active');
      
      clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        secondsLeft--;
        const mins = Math.floor(secondsLeft / 60);
        const secs = secondsLeft % 60;
        
        newOtpTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (secondsLeft <= 0) {
          clearInterval(countdownInterval);
          newOtpTimer.parentElement.innerHTML = 'Namba tayari imeshaisha muda wake';
          btnResend.disabled = false;
          btnResend.classList.add('active');
        }
      }, 1000);
      
    }, 1000);
  });

  // Verify OTP button
  btnVerify.addEventListener('click', () => {
    // Check if all OTP boxes are filled
    let otpValue = '';
    otpInputs.forEach(input => otpValue += input.value);

    if (otpValue.length === 6) {
      btnVerify.classList.add('loading');
      btnVerify.disabled = true;

      // Simulated network authentication delay (2 seconds)
      setTimeout(() => {
        btnVerify.classList.remove('loading');
        btnVerify.disabled = false;
        clearInterval(countdownInterval);
        
        // Initialize Dashboard and transition
        initDashboard();
        showStage(dashboardStage);
      }, 2000);
    } else {
      // Bounce animation error warning
      otpInputs.forEach(input => {
        input.style.borderColor = 'var(--error)';
        input.animate([
          { transform: 'translateX(0)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(0)' }
        ], { duration: 200 });
        
        setTimeout(() => {
          input.style.borderColor = '#e2e8f0';
        }, 1000);
      });
    }
  });

  // ==========================================================================
  // DASHBOARD OPERATIONS & ANIMATIONS
  // ==========================================================================
  function setProgress(percent) {
    const radius = 90;
    const circumference = 2 * Math.PI * radius; // 565.48
    const offset = circumference - (percent / 100 * circumference);
    progressRingCircle.style.strokeDashoffset = offset;
  }

  function updateDashboardDataDisplay() {
    const remainingData = (totalData - usedData).toFixed(1);
    dataVal.textContent = remainingData;
    usedDataVal.textContent = `${usedData.toFixed(1)} GB`;
    
    const percentage = (remainingData / totalData) * 100;
    setProgress(percentage);
  }

  function initDashboard() {
    // Reset data
    totalData = 50.0;
    usedData = 0.2;
    hasSpun = false;
    btnSpin.disabled = false;
    btnSpin.textContent = "ZUNGUSHA";
    spinStatus.textContent = "Gusa kitufe cha Zungusha ili ujaribu bahati yako!";
    spinStatus.style.color = "var(--text-muted)";
    spinWheel.style.transition = 'none';
    spinWheel.style.transform = 'rotate(0deg)';
    
    updateDashboardDataDisplay();
    startNetworkSim();
  }

  // Speed and ping live fluctuations
  function startNetworkSim() {
    clearInterval(speedInterval);
    
    speedInterval = setInterval(() => {
      let is5G = toggle5G.checked;
      
      let basePing = is5G ? 6 : 18;
      let baseDl = is5G ? 134.5 : 34.6;
      let baseUl = is5G ? 45.2 : 12.1;
      
      // Add minor random fluctuation
      let ping = Math.max(2, Math.round(basePing + (Math.random() * 4 - 2)));
      let dl = Math.max(0.1, (baseDl + (Math.random() * 8 - 4))).toFixed(1);
      let ul = Math.max(0.1, (baseUl + (Math.random() * 3 - 1.5))).toFixed(1);
      
      speedPing.textContent = ping;
      speedDl.textContent = dl;
      speedUl.textContent = ul;
      
      // Slightly increase data usage every 4 seconds to make the chart feel alive
      if (document.getElementById('toggle-saver').checked) {
        usedData += 0.002;
      } else {
        usedData += 0.008; // Matumizi ya kawaida/5G boost
      }
      updateDashboardDataDisplay();
      
    }, 4000);
  }

  // 5G Boost quick toggle listener to trigger speed boost animation instantly
  toggle5G.addEventListener('change', () => {
    const isChecked = toggle5G.checked;
    
    // Quick flashing animation to mock hardware switch
    const speedItems = document.querySelectorAll('.speed-item');
    speedItems.forEach(item => {
      item.style.opacity = '0.3';
      setTimeout(() => { item.style.opacity = '1'; }, 200);
    });

    if (isChecked) {
      speedPing.textContent = '6';
      speedDl.textContent = '145.2';
      speedUl.textContent = '48.9';
      showToast("🚀 Hali ya 5G Boost Imewashwa! Kasi imeongezeka.");
    } else {
      speedPing.textContent = '18';
      speedDl.textContent = '35.4';
      speedUl.textContent = '11.8';
    }
  });

  // Logout button on dashboard
  btnLogout.addEventListener('click', () => {
    clearInterval(speedInterval);
    // Reset forms
    claimForm.reset();
    otpInputs.forEach(input => input.value = '');
    showStage(loginStage);
  });

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================
  function showToast(message, icon = "🎁") {
    toast.querySelector('.toast-icon').textContent = icon;
    toast.querySelector('.toast-message').textContent = message;
    
    toast.classList.remove('toast-hidden');
    // Force layout reflow
    toast.offsetHeight;
    toast.classList.add('toast-show');
    
    // Auto-hide toast after 4 seconds
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        toast.classList.add('toast-hidden');
      }, 400);
    }, 4000);
  }

  // ==========================================================================
  // INTERACTIVE SPIN WHEEL GAME
  // ==========================================================================
  btnSpin.addEventListener('click', () => {
    if (hasSpun) return;
    
    hasSpun = true;
    btnSpin.disabled = true;
    btnSpin.textContent = "WAIT...";
    spinStatus.textContent = "Kuzungusha gurudumu la bahati...";
    spinStatus.style.color = "var(--primary-gold)";

    // Pick a random sector to win
    // Force sector 5 (5 GB!), sector 1 (500 MB), sector 3 (1 GB) or sector 7 (2 GB) to give users a great rewarding feeling!
    const rewardSectors = [1, 3, 5, 7];
    const randomIndex = Math.floor(Math.random() * rewardSectors.length);
    const winningSectorIndex = rewardSectors[randomIndex];
    const winningSector = wheelSectors[winningSectorIndex];
    
    // Calculated rotation
    // 360 / 8 sectors = 45 degrees per sector.
    // To land on sector i, the wheel must stop at:
    // angle = 360 - (i * 45) - 22.5 (center of the sector)
    // Add 5 full spins (1800 deg) for visual excitement.
    const sectorAngle = 45;
    const centerOffset = 22.5;
    const targetDegrees = 1800 + (360 - (winningSectorIndex * sectorAngle) - centerOffset);
    
    spinWheel.style.transition = 'transform 5s cubic-bezier(0.1, 0.8, 0.1, 1)';
    spinWheel.style.transform = `rotate(${targetDegrees}deg)`;

    // Wait for animation to finish (5 seconds)
    setTimeout(() => {
      btnSpin.textContent = "IMETUMIKA";
      
      if (winningSector.value > 0) {
        spinStatus.textContent = `Umeshinda: ${winningSector.label}! Data imeongezwa kwenye salio lako.`;
        spinStatus.style.color = "var(--neon-green)";
        
        // Add prize to balance
        totalData += winningSector.value;
        updateDashboardDataDisplay();
        
        // Show congratulations toast
        showToast(`Hongera! Umeshinda kifurushi cha ziada cha ${winningSector.label}!`, "🎉");
      } else {
        spinStatus.textContent = "Bahati mbaya! Jaribu tena kesho.";
        spinStatus.style.color = "var(--error)";
        showToast("Bahati mbaya! Jaribu tena kesho.", "😔");
      }
    }, 5000);
  });

});
