const COURSES = ["Starter", "Main Course", "Dessert", "Drink"];
const STORAGE_KEY = "chefMenuManagerItems";
const starterItems = [
  {id:1,name:"Creamy Tomato Soup",description:"Slow-cooked tomato soup with fresh herbs.",course:"Starter",price:65},
  {id:2,name:"Herb Grilled Chicken",description:"Grilled chicken served with seasonal vegetables.",course:"Main Course",price:145},
  {id:3,name:"Chocolate Lava Cake",description:"Warm chocolate cake with a soft centre.",course:"Dessert",price:75}
];
let menuItems = loadItems();
let editingId = null;
const byId = id => document.getElementById(id);
const money = amount => new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(amount);

function loadItems(){
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : starterItems; }
  catch { return starterItems; }
}
function saveItems(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(menuItems)); }
function showToast(message){
  const toast=byId("toast"); toast.textContent=message; toast.classList.add("show");
  window.clearTimeout(showToast.timer); showToast.timer=window.setTimeout(()=>toast.classList.remove("show"),2600);
}
function render(){
  const total=menuItems.length;
  const average=total ? menuItems.reduce((sum,item)=>sum+Number(item.price),0)/total : 0;
  byId("totalItems").textContent=total;
  byId("averagePrice").textContent=money(average);
  byId("starterCount").textContent=menuItems.filter(x=>x.course==="Starter").length;
  byId("mainCount").textContent=menuItems.filter(x=>x.course==="Main Course").length;
  byId("dessertCount").textContent=menuItems.filter(x=>x.course==="Dessert").length;
  const search=byId("searchInput").value.trim().toLowerCase();
  const filter=byId("courseFilter").value;
  const visible=menuItems.filter(item=>(filter==="All"||item.course===filter)&&(`${item.name} ${item.description}`.toLowerCase().includes(search)));
  byId("visibleCount").textContent=`${visible.length} ${visible.length===1?"item":"items"}`;
  byId("menuTable").innerHTML=visible.map(item=>`<tr>
    <td>${escapeHtml(item.name)}</td><td class="description-cell">${escapeHtml(item.description)}</td>
    <td><span class="course-tag">${escapeHtml(item.course)}</span></td><td class="price">${money(Number(item.price))}</td>
    <td><div class="actions"><button class="action-button" data-edit="${item.id}">Edit</button><button class="action-button delete" data-delete="${item.id}">Delete</button></div></td>
  </tr>`).join("");
  byId("emptyState").style.display=visible.length?"none":"block";
  byId("courseBreakdown").innerHTML=COURSES.map(course=>`<div class="course-box"><span>${course}</span><strong>${menuItems.filter(x=>x.course===course).length}</strong></div>`).join("");
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));}
function openDialog(item=null){
  editingId=item?item.id:null;
  byId("dialogTitle").textContent=item?"Edit menu item":"Add menu item";
  byId("saveButton").textContent=item?"Save changes":"Save item";
  byId("dishName").value=item?.name||"";
  byId("dishDescription").value=item?.description||"";
  byId("dishCourse").value=item?.course||"";
  byId("dishPrice").value=item?.price??"";
  byId("formMessage").textContent="";
  byId("itemDialog").showModal();
}
function closeDialog(){byId("itemDialog").close();}
byId("newItemButton").addEventListener("click",()=>openDialog());
byId("closeDialog").addEventListener("click",closeDialog);
byId("cancelDialog").addEventListener("click",closeDialog);
byId("searchInput").addEventListener("input",render);
byId("courseFilter").addEventListener("change",render);
byId("menuTable").addEventListener("click",event=>{
  const edit=event.target.closest("[data-edit]");
  const remove=event.target.closest("[data-delete]");
  if(edit){const item=menuItems.find(x=>x.id===Number(edit.dataset.edit));if(item)openDialog(item);}
  if(remove){
    const id=Number(remove.dataset.delete);
    const item=menuItems.find(x=>x.id===id);
    if(item&&confirm(`Delete "${item.name}" from the menu?`)){
      menuItems=menuItems.filter(x=>x.id!==id);saveItems();render();showToast("Menu item deleted successfully.");
    }
  }
});
byId("menuForm").addEventListener("submit",event=>{
  event.preventDefault();
  const name=byId("dishName").value.trim();
  const description=byId("dishDescription").value.trim();
  const course=byId("dishCourse").value;
  const price=Number(byId("dishPrice").value);
  let error="";
  if(!name||!description||!course||!byId("dishPrice").value) error="Please complete all fields.";
  else if(!COURSES.includes(course)) error="Please choose a valid course.";
  else if(!Number.isFinite(price)||price<=0) error="Price must be a number greater than zero.";
  if(error){byId("formMessage").textContent=error;return;}
  if(editingId!==null){
    menuItems=menuItems.map(item=>item.id===editingId?{...item,name,description,course,price}:item);
    showToast("Menu item updated successfully.");
  }else{
    menuItems.push({id:Date.now(),name,description,course,price});
    showToast("Menu item added successfully.");
  }
  saveItems();closeDialog();render();
});
render();
