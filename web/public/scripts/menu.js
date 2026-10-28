// Mobile menu: the button shows or hides the drawer in the header (pushes content down); Escape closes it.
(function(){var b=document.querySelector('.mobile-menu-btn'),d=b&&document.getElementById(b.getAttribute('aria-controls'));if(!d)return;
function s(o){b.setAttribute('aria-expanded',o);d.classList.toggle('is-closed',!o);b.lastElementChild.textContent=b.dataset[o?'labelClose':'labelOpen']}
b.onclick=function(){s(b.getAttribute('aria-expanded')!=='true')};
document.onkeydown=function(e){if(e.key==='Escape'&&b.getAttribute('aria-expanded')==='true'){s(false);b.focus()}}})();
